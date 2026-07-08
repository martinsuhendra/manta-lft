import { getZonedCalendarParts, zonedTimeToUtc } from "./studio-timezone";

export interface SessionForPolicy {
  date: Date;
  startTime: string;
}

function parseStartTime(startTime: string): [number, number] {
  const parts = startTime.trim().split(":");
  const hours = parseInt(parts[0] ?? "0", 10);
  const minutes = parseInt(parts[1] ?? "0", 10);
  return [hours, minutes];
}

/**
 * Combines session date and startTime into a UTC instant for the studio-local start.
 */
export function getSessionStartAt(session: SessionForPolicy): Date {
  const { year, month, day } = getZonedCalendarParts(new Date(session.date));
  const [hours, minutes] = parseStartTime(session.startTime);
  return zonedTimeToUtc(year, month, day, hours, minutes);
}
