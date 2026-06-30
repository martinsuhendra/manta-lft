import { NextRequest, NextResponse } from "next/server";

import { z } from "zod";

import { handleApiError, requireAdmin, requireAuth } from "@/lib/api-utils";
import { doesBookingStatusConsumeQuota } from "@/lib/booking-status";
import { prisma } from "@/lib/generated/prisma";
import { restoreQuota } from "@/lib/quota-utils";
import { RBAC_ADMIN_ROLES } from "@/lib/rbac";
import { sumParticipantSlots } from "@/lib/session-utils";
import { USER_ROLES } from "@/lib/types";

import { checkForDuplicateSession } from "./duplicate-helpers";
import { sendCancellationEmailsToBookings, sendUpdateEmailsToBookings } from "./email-helpers";
import { buildUpdateData, detectChanges, buildSessionInfo } from "./session-helpers";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { error, session } = await requireAuth();
    if (error) return error;

    const isAdmin = RBAC_ADMIN_ROLES.includes(session.user.role);
    const isTeacher = session.user.role === USER_ROLES.TEACHER;
    if (!isAdmin && !isTeacher) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    const classSession = await prisma.classSession.findUnique({
      where: { id },
      include: {
        item: {
          select: {
            id: true,
            name: true,
            duration: true,
            capacity: true,
            color: true,
          },
        },
        teacher: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        bookings: {
          where: {
            status: {
              not: "CANCELLED",
            },
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: {
            createdAt: "asc",
          },
        },
        _count: {
          select: {
            bookings: true,
          },
        },
      },
    });

    if (!classSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const canTeacherAccessSession = classSession.visibility === "PUBLIC" || classSession.teacherId === session.user.id;
    if (isTeacher && !canTeacherAccessSession) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const occupiedBookings = classSession.bookings.filter((b) => b.status === "RESERVED" || b.status === "CHECKED_IN");
    const { bookings, ...rest } = classSession;
    return NextResponse.json({ ...rest, bookings, totalParticipantSlots: sumParticipantSlots(occupiedBookings) });
  } catch (error) {
    console.error("Error fetching session:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

const updateSessionSchema = z.object({
  itemId: z.string().min(1, "Item is required").optional(),
  teacherId: z.string().optional().nullable(),
  date: z.string().min(1, "Date is required").optional(),
  startTime: z
    .string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format")
    .optional(),
  endTime: z
    .string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format")
    .optional(),
  status: z.enum(["SCHEDULED", "CANCELLED", "COMPLETED"]).optional(),
  visibility: z.enum(["PUBLIC", "PRIVATE"]).optional(),
  notes: z.string().optional().nullable(),
});

function calculateEndTime(startTime: string, durationMinutes: number): string {
  const [hours, minutes] = startTime.split(":").map(Number);
  const startMinutes = hours * 60 + minutes;
  const endMinutes = startMinutes + durationMinutes;

  const endHours = Math.floor(endMinutes / 60);
  const endMins = endMinutes % 60;

  return `${endHours.toString().padStart(2, "0")}:${endMins.toString().padStart(2, "0")}`;
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const { id } = await params;
    const body = await request.json();
    const validatedData = updateSessionSchema.parse(body);

    // Check if session exists with bookings
    const existingSession = await prisma.classSession.findUnique({
      where: { id },
      include: {
        item: {
          select: {
            duration: true,
            name: true,
          },
        },
        teacher: {
          select: {
            name: true,
            email: true,
          },
        },
        bookings: {
          where: {
            status: {
              not: "CANCELLED",
            },
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!existingSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Prepare update data
    const updateData = buildUpdateData(validatedData, existingSession, calculateEndTime);

    // Check for duplicate if date or startTime is being updated
    if (validatedData.date || validatedData.startTime) {
      const itemId = validatedData.itemId || existingSession.itemId;
      const date = validatedData.date ? new Date(validatedData.date) : existingSession.date;
      const startTime = validatedData.startTime || existingSession.startTime;

      const { isDuplicate } = await checkForDuplicateSession({
        sessionId: id,
        itemId,
        date,
        startTime,
      });

      if (isDuplicate) {
        return NextResponse.json(
          { error: "A session already exists for this item at this date and time" },
          { status: 409 },
        );
      }
    }

    const updatedSession = await prisma.classSession.update({
      where: { id },
      data: updateData,
      include: {
        item: {
          select: {
            id: true,
            name: true,
            duration: true,
            capacity: true,
            color: true,
          },
        },
        teacher: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        bookings: {
          where: {
            status: {
              not: "CANCELLED",
            },
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        _count: {
          select: {
            bookings: true,
          },
        },
      },
    });

    // Send email notifications to participants
    if (existingSession.bookings.length > 0) {
      const sessionInfo = buildSessionInfo(updatedSession);
      const changes = detectChanges(validatedData, existingSession, updatedSession);

      // Send emails based on action
      if (validatedData.status === "CANCELLED") {
        await sendCancellationEmailsToBookings(existingSession.bookings, sessionInfo);
      } else if (changes.length > 0) {
        await sendUpdateEmailsToBookings(existingSession.bookings, sessionInfo, changes);
      }
    }

    return NextResponse.json(updatedSession);
  } catch (error) {
    return handleApiError(error, "Failed to update session");
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const { id } = await params;

    const classSession = await prisma.classSession.findUnique({
      where: { id },
      select: { id: true, itemId: true },
    });

    if (!classSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const bookings = await tx.booking.findMany({
        where: { classSessionId: id },
        include: {
          membership: {
            include: {
              product: {
                include: {
                  // Include inactive items so historical bookings still map correctly for refund.
                  productItems: {
                    where: {
                      itemId: classSession.itemId,
                    },
                    include: {
                      quotaPool: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      let refundedBookings = 0;
      let skippedRefunds = 0;

      for (const booking of bookings) {
        if (!doesBookingStatusConsumeQuota(booking.status)) continue;
        const productItem = booking.membership.product.productItems.at(0);
        if (!productItem) {
          skippedRefunds += 1;
          continue;
        }
        await restoreQuota({
          tx,
          membershipId: booking.membershipId,
          productItem,
        });
        refundedBookings += 1;
      }

      await tx.booking.deleteMany({
        where: {
          classSessionId: id,
        },
      });

      await tx.classSession.delete({ where: { id } });

      skippedRefunds = bookings.filter((booking) => !doesBookingStatusConsumeQuota(booking.status)).length;
      return {
        deletedBookings: bookings.length,
        refundedBookings,
        skippedRefunds,
      };
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    return handleApiError(error, "Failed to delete session");
  }
}
