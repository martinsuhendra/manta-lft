/* eslint-disable @typescript-eslint/no-unnecessary-condition */
import { NextRequest, NextResponse } from "next/server";

import { requireAdmin } from "@/lib/api-utils";
import { doesBookingStatusConsumeQuota, getCapacityBookingStatuses } from "@/lib/booking-status";
import { emailService } from "@/lib/email/service";
import { createSessionPromotedFromWaitlistTemplate } from "@/lib/email/templates";
import { prisma } from "@/lib/generated/prisma";
import { checkQuotaAvailability, deductQuota, restoreQuota } from "@/lib/quota-utils";
import { sumParticipantSlots } from "@/lib/session-utils";

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string; bookingId: string }> }) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const { id: sessionId, bookingId } = await params;

    // Validate session exists with item and teacher info
    const classSession = await prisma.classSession.findUnique({
      where: { id: sessionId },
      include: {
        item: {
          select: {
            id: true,
            name: true,
            capacity: true,
          },
        },
        teacher: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!classSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Get booking with all necessary relations
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        membership: {
          include: {
            product: {
              include: {
                // Include inactive items so quota still restores if a product item was deactivated after booking
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
            quotaUsage: true,
          },
        },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Validate booking belongs to this session
    if (booking.classSessionId !== sessionId) {
      return NextResponse.json({ error: "Booking does not belong to this session" }, { status: 400 });
    }

    const productItem = booking.membership.product.productItems[0];
    const consumedCapacityAndQuota = doesBookingStatusConsumeQuota(booking.status);

    // Delete booking, restore quota, and auto-confirm waitlisted member in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Delete the booking
      await tx.booking.delete({
        where: { id: bookingId },
      });

      // Restore quota only when the booking consumed quota
      if (consumedCapacityAndQuota && productItem) {
        await restoreQuota({ tx, membershipId: booking.membershipId, productItem });
      }

      const confirmedBookings = await tx.booking.findMany({
        where: { classSessionId: sessionId, status: { in: getCapacityBookingStatuses() } },
        select: { participantCount: true },
      });
      const totalParticipantSlots = sumParticipantSlots(confirmedBookings);

      const firstWaitlisted = await tx.booking.findFirst({
        where: {
          classSessionId: sessionId,
          status: "WAITLISTED",
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          membership: {
            include: {
              product: {
                include: {
                  productItems: {
                    where: {
                      itemId: classSession.itemId,
                      isActive: true,
                    },
                    include: {
                      quotaPool: true,
                    },
                  },
                },
              },
              quotaUsage: true,
            },
          },
        },
        orderBy: {
          createdAt: "asc", // First come, first served
        },
      });

      if (firstWaitlisted) {
        const waitlistedProductItem = firstWaitlisted.membership.product.productItems[0];

        if (!waitlistedProductItem) {
          return { waitlistedConfirmed: null };
        }

        const slotsNeeded = firstWaitlisted.membership.product.participantsPerPurchase ?? 1;
        const hasRoom = totalParticipantSlots + slotsNeeded <= classSession.item.capacity;

        const hasQuota = checkQuotaAvailability(waitlistedProductItem, firstWaitlisted.membership.quotaUsage);

        // Only confirm if quota is available and there is room (participant slots)
        if (hasQuota && hasRoom) {
          // Update booking status to CHECKED_IN
          await tx.booking.update({
            where: { id: firstWaitlisted.id },
            data: { status: "CHECKED_IN" },
          });

          await deductQuota({ tx, membershipId: firstWaitlisted.membershipId, productItem: waitlistedProductItem });

          return { waitlistedConfirmed: firstWaitlisted };
        }
      }

      return { waitlistedConfirmed: null };
    });

    // Send email to newly confirmed waitlisted member
    if (result.waitlistedConfirmed?.user.email) {
      try {
        const sessionInfo = {
          itemName: classSession.item.name,
          date: classSession.date.toISOString(),
          startTime: classSession.startTime,
          endTime: classSession.endTime,
          teacher: classSession.teacher
            ? {
                name: classSession.teacher.name,
                email: classSession.teacher.email,
              }
            : null,
          notes: classSession.notes,
        };

        const emailTemplate = createSessionPromotedFromWaitlistTemplate(
          sessionInfo,
          result.waitlistedConfirmed.user.name || result.waitlistedConfirmed.user.email,
        );
        await emailService.sendEmail(result.waitlistedConfirmed.user.email, emailTemplate);
      } catch (emailError) {
        console.error("Failed to send waitlist confirmation email:", emailError);
        // Don't fail the request if email fails
      }
    }

    return NextResponse.json({
      success: true,
      message: "Participant removed successfully",
      waitlistedConfirmed: result.waitlistedConfirmed ? true : false,
    });
  } catch (error) {
    console.error("Error removing participant:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
