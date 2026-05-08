/* eslint-disable complexity */
import { NextRequest, NextResponse } from "next/server";

import { getServerSession } from "next-auth";

import { authOptions } from "@/auth";
import { requireBrandAccess } from "@/lib/api-utils";
import {
  canMemberCancel,
  getBookingSettings,
  getCancelDeadline,
  getSessionStartAt,
  isPastBookingCutoff,
} from "@/lib/booking-settings";
import { getCapacityBookingStatuses } from "@/lib/booking-status";
import { prisma } from "@/lib/generated/prisma";
import { resolveEligibleMembershipsForItem } from "@/lib/session-booking-eligibility";
import { USER_ROLES } from "@/lib/types";
import { getWaiverSettings, hasAcceptedCurrentWaiver } from "@/lib/waiver-settings";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    const classSession = await prisma.classSession.findUnique({
      where: { id: sessionId },
      include: { item: true },
    });

    if (!classSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }
    if (classSession.brandId !== selectedBrandId) {
      return NextResponse.json({ error: "Session not available for selected brand" }, { status: 404 });
    }

    if (classSession.status !== "SCHEDULED") {
      return NextResponse.json({ canJoin: false, reason: "Session is not available for booking" }, { status: 200 });
    }
    if (classSession.visibility === "PRIVATE") {
      return NextResponse.json(
        { canJoin: false, reason: "Session is private and not publicly bookable" },
        { status: 200 },
      );
    }
    if (!classSession.item.isPublic || !classSession.item.isActive) {
      return NextResponse.json({ canJoin: false, reason: "Session is not publicly available" }, { status: 200 });
    }

    const existingBooking = await prisma.booking.findUnique({
      where: {
        classSessionId_userId: {
          classSessionId: sessionId,
          userId,
        },
      },
    });

    const alreadyBooked = !!existingBooking && existingBooking.status !== "CANCELLED";
    const bookingId = alreadyBooked ? existingBooking.id : undefined;

    if (alreadyBooked) {
      const settings = await getBookingSettings(selectedBrandId);
      const sessionStartAt = getSessionStartAt({
        date: classSession.date,
        startTime: classSession.startTime,
      });
      const canCancel = canMemberCancel(sessionStartAt, settings.cancellationDeadlineHours);
      const cancelDeadline = getCancelDeadline(sessionStartAt, settings.cancellationDeadlineHours);
      return NextResponse.json({
        canJoin: false,
        alreadyBooked: true,
        bookingId,
        canCancel,
        cancelDeadline: cancelDeadline.toISOString(),
        eligibleMemberships: [],
        reason: "You are already booked for this session",
      });
    }

    const settings = await getBookingSettings(selectedBrandId);
    const sessionStartAt = getSessionStartAt({
      date: classSession.date,
      startTime: classSession.startTime,
    });
    if (isPastBookingCutoff(sessionStartAt, settings.endBookingPeriodHours)) {
      return NextResponse.json({
        canJoin: false,
        alreadyBooked: false,
        eligibleMemberships: [],
        reason: "Booking for this session has closed.",
      });
    }

    const { _sum } = await prisma.booking.aggregate({
      where: {
        classSessionId: sessionId,
        status: { in: getCapacityBookingStatuses() },
      },
      _sum: { participantCount: true },
    });
    const totalSlots = _sum.participantCount ?? 0;
    const spotsLeft = Math.max(0, classSession.item.capacity - totalSlots);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        waiverAcceptedVersion: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const waiver = await getWaiverSettings();
    if (
      waiver.isActive &&
      !hasAcceptedCurrentWaiver({
        acceptedVersion: user.waiverAcceptedVersion,
        waiverVersion: waiver.version,
      })
    ) {
      return NextResponse.json({
        canJoin: false,
        alreadyBooked: false,
        eligibleMemberships: [],
        reason: "Waiver not accepted",
      });
    }

    const eligibleOptions = await resolveEligibleMembershipsForItem({
      userId,
      itemId: classSession.itemId,
      brandId: selectedBrandId,
    });

    const eligibleMemberships: Array<{
      id: string;
      product: { name: string };
      slotsRequired: number;
      remainingQuota: number | null;
      isEligible: true;
    }> = eligibleOptions.map((membership) => ({
      id: membership.id,
      product: { name: membership.productName },
      slotsRequired: membership.slotsRequired,
      remainingQuota: membership.remainingQuota,
      isEligible: true,
    }));

    if (eligibleMemberships.length === 0) {
      return NextResponse.json({
        canJoin: false,
        alreadyBooked: false,
        eligibleMemberships: [],
        reason: "No eligible membership for this class",
      });
    }

    return NextResponse.json({
      canJoin: true,
      alreadyBooked: false,
      spotsLeft,
      eligibleMemberships,
    });
  } catch (error) {
    console.error("Error fetching session eligibility:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
