/** Studio wall-clock timezone — used for session times and booking policy deadlines. */
export const STUDIO_TIMEZONE = "Asia/Jakarta";

interface ZonedParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
}

function getZonedParts(instant: Date, timeZone: string): ZonedParts {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  });
  const parts = formatter.formatToParts(instant);
  const get = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((p) => p.type === type)?.value ?? "0");

  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour: get("hour") % 24,
    minute: get("minute"),
  };
}

/** Converts a wall-clock date/time in the studio timezone to a UTC instant. */
export function zonedTimeToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  timeZone: string = STUDIO_TIMEZONE,
): Date {
  let utc = new Date(Date.UTC(year, month - 1, day, hour, minute, 0));
  const target = { year, month, day, hour, minute };

  for (let i = 0; i < 4; i++) {
    const actual = getZonedParts(utc, timeZone);
    if (
      actual.year === target.year &&
      actual.month === target.month &&
      actual.day === target.day &&
      actual.hour === target.hour &&
      actual.minute === target.minute
    ) {
      return utc;
    }

    const targetAsUtc = Date.UTC(target.year, target.month - 1, target.day, target.hour, target.minute);
    const actualAsUtc = Date.UTC(actual.year, actual.month - 1, actual.day, actual.hour, actual.minute);
    utc = new Date(utc.getTime() + (targetAsUtc - actualAsUtc));
  }

  return utc;
}

export function getZonedCalendarParts(date: Date, timeZone: string = STUDIO_TIMEZONE) {
  const { year, month, day } = getZonedParts(date, timeZone);
  return { year, month, day };
}

const studioDateTimeFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: STUDIO_TIMEZONE,
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

/** Formats an ISO/UTC instant for members in studio local time (e.g. cancel deadlines). */
export function formatStudioDateTime(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return studioDateTimeFormatter.format(date);
}
