import { prisma } from "@/lib/generated/prisma";

import { getSessionStartAt, type SessionForPolicy } from "./session-datetime";

export type { SessionForPolicy };
export { getSessionStartAt };

/** Default values when no BookingSettings row exists (e.g. first deploy). */
export const DEFAULT_BOOKING_SETTINGS = {
  endBookingPeriodHours: 0,
  cancellationDeadlineHours: 24,
} as const;

export type BookingSettingsRecord = {
  endBookingPeriodHours: number;
  cancellationDeadlineHours: number;
};

/**
 * Returns current booking settings from DB for the given brand, or defaults if no row exists.
 * Used by enforcement (member book/cancel, eligibility) and by Settings UI.
 */
export async function getBookingSettings(brandId?: string): Promise<BookingSettingsRecord> {
  const where = brandId ? { brandId } : {};
  const row = await prisma.bookingSettings.findFirst({
    where,
    orderBy: { createdAt: "asc" },
  });
  if (!row) {
    return { ...DEFAULT_BOOKING_SETTINGS };
  }
  return {
    endBookingPeriodHours: row.endBookingPeriodHours,
    cancellationDeadlineHours: row.cancellationDeadlineHours,
  };
}

/**
 * True if members can no longer book this session (past the configured cutoff).
 * Cutoff = sessionStart - endBookingPeriodHours.
 * When endBookingPeriodHours is 0, cutoff = sessionStart (can book until start).
 */
export function isPastBookingCutoff(
  sessionStartAt: Date,
  endBookingPeriodHours: number,
  now: Date = new Date(),
): boolean {
  const cutoffMs = endBookingPeriodHours * 60 * 60 * 1000;
  const cutoff = new Date(sessionStartAt.getTime() - cutoffMs);
  return now >= cutoff;
}

/**
 * True if the session has already started or ended (member cannot book or cancel).
 */
export function isSessionStartedOrEnded(sessionStartAt: Date, now: Date = new Date()): boolean {
  return now >= sessionStartAt;
}

/**
 * True if a member is still allowed to cancel (before cancellation deadline and before session start).
 * Deadline = sessionStart - cancellationDeadlineHours.
 */
export function canMemberCancel(
  sessionStartAt: Date,
  cancellationDeadlineHours: number,
  now: Date = new Date(),
): boolean {
  if (now >= sessionStartAt) return false;
  const deadlineMs = cancellationDeadlineHours * 60 * 60 * 1000;
  const deadline = new Date(sessionStartAt.getTime() - deadlineMs);
  return now < deadline;
}

/**
 * Returns the cancellation deadline as a Date (last moment member can cancel).
 */
export function getCancelDeadline(sessionStartAt: Date, cancellationDeadlineHours: number): Date {
  const deadlineMs = cancellationDeadlineHours * 60 * 60 * 1000;
  return new Date(sessionStartAt.getTime() - deadlineMs);
}
