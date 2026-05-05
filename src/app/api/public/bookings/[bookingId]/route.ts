/* eslint-disable complexity, @typescript-eslint/no-unnecessary-condition */
import { NextRequest, NextResponse } from "next/server";

import { getServerSession } from "next-auth";

import { authOptions } from "@/auth";
import { requireBrandAccess } from "@/lib/api-utils";
import { canMemberCancel, getBookingSettings, getSessionStartAt } from "@/lib/booking-settings";
import { doesBookingStatusConsumeQuota, getCapacityBookingStatuses } from "@/lib/booking-status";
import { emailService } from "@/lib/email/service";
import {
  createMemberBookingCancellationConfirmationTemplate,
  createSessionPromotedFromWaitlistTemplate,
} from "@/lib/email/templates";
import { prisma } from "@/lib/generated/prisma";
import { checkQuotaAvailability, deductQuota, restoreQuota } from "@/lib/quota-utils";
import { sumParticipantSlots } from "@/lib/session-utils";
import { USER_ROLES } from "@/lib/types";

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ bookingId: string }> }) {
  try {
    const authSession = await getServerSession(authOptions);

    if (!authSession?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (authSession.user.role !== USER_ROLES.MEMBER) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { error, brandIds } = await requireBrandAccess(request);
    if (error) return error;
    const selectedBrandId = request.headers.get("x-brand-id") ?? brandIds?.[0] ?? null;
    if (!selectedBrandId) {
      return NextResponse.json({ error: "No active brand selected" }, { status: 400 });
    }
    if (!brandIds?.includes(selectedBrandId)) {
      return NextResponse.json({ error: "Forbidden for this brand" }, { status: 403 });
    }

    const userId = authSession.user.id;
    const { bookingId } = await params;

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        user: { select: { id: true, name: true, email: true } },
        classSession: {
          include: {
            item: { select: { id: true, name: true, capacity: true } },
            teacher: { select: { name: true, email: true } },
          },
        },
        membership: {
          include: {
            product: {
              include: {
                productItems: { include: { quotaPool: true } },
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
    if (booking.brandId !== selectedBrandId) {
      return NextResponse.json({ error: "Booking not found for selected brand" }, { status: 404 });
    }

    if (booking.userId !== userId) {
      return NextResponse.json({ error: "You can only cancel your own bookings" }, { status: 403 });
    }

    const settings = await getBookingSettings(selectedBrandId);
    const sessionStartAt = getSessionStartAt({
      date: booking.classSession.date,
      startTime: booking.classSession.startTime,
    });
    if (!canMemberCancel(sessionStartAt, settings.cancellationDeadlineHours)) {
      return NextResponse.json({ error: "Cancellation is no longer allowed for this session." }, { status: 400 });
    }

    const itemId = booking.classSession.itemId;
    const consumedCapacityAndQuota = doesBookingStatusConsumeQuota(booking.status);
    const productItemForRestore = consumedCapacityAndQuota
      ? (booking.membership.product.productItems.find((pi) => pi.itemId === itemId) ?? null)
      : null;

    const sessionInfo = {
      itemName: booking.classSession.item.name,
      date: booking.classSession.date.toISOString(),
      startTime: booking.classSession.startTime,
      endTime: booking.classSession.endTime,
      teacher: booking.classSession.teacher
        ? { name: booking.classSession.teacher.name, email: booking.classSession.teacher.email }
        : null,
      notes: booking.classSession.notes,
    };

    const classSession = booking.classSession;

    const result = await prisma.$transaction(async (tx) => {
      await tx.booking.delete({
        where: { id: bookingId },
      });

      if (consumedCapacityAndQuota && productItemForRestore) {
        await restoreQuota({ tx, membershipId: booking.membershipId, productItem: productItemForRestore });
      }

      const confirmedBookings = await tx.booking.findMany({
        where: { classSessionId: classSession.id, status: { in: getCapacityBookingStatuses() } },
        select: { participantCount: true },
      });
      const totalParticipantSlots = sumParticipantSlots(confirmedBookings);

      const firstWaitlisted = await tx.booking.findFirst({
        where: {
          classSessionId: classSession.id,
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
          createdAt: "asc",
        },
      });

      if (!firstWaitlisted) {
        return { waitlistedConfirmed: null };
      }

      const waitlistedProductItem = firstWaitlisted.membership.product.productItems[0];

      if (!waitlistedProductItem) {
        return { waitlistedConfirmed: null };
      }

      const slotsNeeded = firstWaitlisted.membership.product.participantsPerPurchase ?? 1;
      const hasRoom = totalParticipantSlots + slotsNeeded <= classSession.item.capacity;
      const hasQuota = checkQuotaAvailability(waitlistedProductItem, firstWaitlisted.membership.quotaUsage);

      if (hasQuota && hasRoom) {
        await tx.booking.update({
          where: { id: firstWaitlisted.id },
          data: { status: "CHECKED_IN" },
        });

        await deductQuota({ tx, membershipId: firstWaitlisted.membershipId, productItem: waitlistedProductItem });

        return { waitlistedConfirmed: firstWaitlisted };
      }

      return { waitlistedConfirmed: null };
    });

    if (booking.user.email) {
      try {
        const cancelTpl = createMemberBookingCancellationConfirmationTemplate(
          sessionInfo,
          booking.user.name || booking.user.email,
        );
        await emailService.sendEmail(booking.user.email, cancelTpl);
      } catch (emailError) {
        console.error("Failed to send booking cancellation confirmation email:", emailError);
      }
    }

    if (result.waitlistedConfirmed?.user.email) {
      try {
        const promotedTpl = createSessionPromotedFromWaitlistTemplate(
          sessionInfo,
          result.waitlistedConfirmed.user.name || result.waitlistedConfirmed.user.email,
        );
        await emailService.sendEmail(result.waitlistedConfirmed.user.email, promotedTpl);
      } catch (emailError) {
        console.error("Failed to send waitlist promotion email:", emailError);
      }
    }

    return NextResponse.json({
      success: true,
      waitlistedConfirmed: Boolean(result.waitlistedConfirmed),
    });
  } catch (error) {
    console.error("Error cancelling booking:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
