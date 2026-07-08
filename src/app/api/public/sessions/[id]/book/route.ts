/* eslint-disable complexity */
import { NextRequest, NextResponse } from "next/server";

import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/auth";
import { requireBrandAccess } from "@/lib/api-utils";
import { getBookingSettings, getSessionStartAt, isPastBookingCutoff } from "@/lib/booking-settings";
import { getCapacityBookingStatuses } from "@/lib/booking-status";
import { emailService } from "@/lib/email/service";
import { createSessionJoinedTemplate } from "@/lib/email/session-templates";
import { prisma } from "@/lib/generated/prisma";
import { deductQuota } from "@/lib/quota-utils";
import { resolveEligibleMembershipsForItem } from "@/lib/session-booking-eligibility";
import { USER_ROLES } from "@/lib/types";
import { hasUserAcceptedAllActiveWaivers } from "@/lib/waiver-settings";

const bookSchema = z.object({
  membershipId: z.string().uuid("Invalid membership ID"),
});

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== USER_ROLES.MEMBER) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { error, brandIds } = await requireBrandAccess(request);
    if (error) return error;
    const selectedBrandId = request.headers.get("x-brand-id") ?? brandIds?.[0] ?? null;
    if (!selectedBrandId) {
      return NextResponse.json({ error: "No active brand selected" }, { status: 400 });
    }
    if (brandIds && !brandIds.includes(selectedBrandId)) {
      return NextResponse.json({ error: "Forbidden for this brand" }, { status: 403 });
    }

    const userId = session.user.id;
    const { id: sessionId } = await params;
    const body = await request.json();
    const { membershipId } = bookSchema.parse(body);

    const classSession = await prisma.classSession.findUnique({
      where: { id: sessionId },
      include: {
        item: true,
        teacher: { select: { name: true, email: true } },
      },
    });

    if (!classSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }
    if (classSession.brandId !== selectedBrandId) {
      return NextResponse.json({ error: "Session not available for selected brand" }, { status: 404 });
    }

    if (classSession.status !== "SCHEDULED") {
      return NextResponse.json({ error: "Session is not available for booking" }, { status: 400 });
    }
    if (classSession.visibility === "PRIVATE") {
      return NextResponse.json({ error: "Session is private and not publicly bookable" }, { status: 403 });
    }
    if (!classSession.item.isPublic || !classSession.item.isActive) {
      return NextResponse.json({ error: "Session is not publicly available" }, { status: 403 });
    }

    const settings = await getBookingSettings(selectedBrandId);
    const sessionStartAt = getSessionStartAt({
      date: classSession.date,
      startTime: classSession.startTime,
    });
    if (isPastBookingCutoff(sessionStartAt, settings.endBookingPeriodHours)) {
      return NextResponse.json(
        {
          error:
            settings.endBookingPeriodHours === 0
              ? "Booking has closed for this session."
              : `Booking has closed for this session (closes ${settings.endBookingPeriodHours} hour(s) before start).`,
        },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.role !== USER_ROLES.MEMBER) {
      return NextResponse.json({ error: "You must have a member account to book" }, { status: 400 });
    }

    const hasAcceptedAllWaivers = await hasUserAcceptedAllActiveWaivers(userId);
    if (!hasAcceptedAllWaivers) {
      return NextResponse.json({ error: "Waiver not accepted" }, { status: 400 });
    }

    const existingBooking = await prisma.booking.findUnique({
      where: {
        classSessionId_userId: {
          classSessionId: sessionId,
          userId,
        },
      },
    });

    if (existingBooking && existingBooking.status !== "CANCELLED") {
      return NextResponse.json({ error: "You are already booked for this session" }, { status: 400 });
    }

    const eligibleMemberships = await resolveEligibleMembershipsForItem({
      userId,
      itemId: classSession.itemId,
      brandId: selectedBrandId,
    });
    const selectedMembership = eligibleMemberships.find((membership) => membership.id === membershipId);
    if (!selectedMembership) {
      return NextResponse.json({ error: "Selected membership is not eligible for this class" }, { status: 400 });
    }

    const participantsPerPurchase = selectedMembership.slotsRequired;
    const { _sum } = await prisma.booking.aggregate({
      where: {
        classSessionId: sessionId,
        status: { in: getCapacityBookingStatuses() },
      },
      _sum: { participantCount: true },
    });
    const totalSlots = _sum.participantCount ?? 0;
    const capacity = classSession.item.capacity;
    if (totalSlots + participantsPerPurchase > capacity) {
      const spotsLeft = Math.max(0, capacity - totalSlots);
      return NextResponse.json(
        {
          error:
            spotsLeft === 0
              ? "Session is at full capacity"
              : `This membership uses ${participantsPerPurchase} spot(s); only ${spotsLeft} spot(s) left in this session.`,
        },
        { status: 400 },
      );
    }

    const booking = await prisma.$transaction(async (tx) => {
      const b = await tx.booking.create({
        data: {
          userId,
          classSessionId: sessionId,
          membershipId,
          brandId: classSession.brandId,
          participantCount: participantsPerPurchase,
          status: "RESERVED",
        },
        include: {
          classSession: {
            select: {
              id: true,
              date: true,
              startTime: true,
              endTime: true,
              item: {
                select: { id: true, name: true },
              },
            },
          },
          membership: {
            select: {
              id: true,
              product: {
                select: { id: true, name: true },
              },
            },
          },
        },
      });

      await deductQuota({ tx, membershipId, productItem: selectedMembership.productItem });

      return b;
    });

    if (user.email) {
      try {
        const sessionInfo = {
          itemName: classSession.item.name,
          date: classSession.date.toISOString(),
          startTime: classSession.startTime,
          endTime: classSession.endTime,
          teacher: classSession.teacher ? { name: classSession.teacher.name, email: classSession.teacher.email } : null,
          notes: classSession.notes,
        };
        const emailTemplate = createSessionJoinedTemplate(sessionInfo, user.name || user.email);
        await emailService.sendEmail(user.email, emailTemplate);
      } catch (emailError) {
        console.error("Failed to send booking confirmation email:", emailError);
      }
    }

    return NextResponse.json(booking, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.errors }, { status: 400 });
    }
    console.error("Error booking session:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
