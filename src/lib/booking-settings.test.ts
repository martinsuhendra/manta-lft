import { describe, expect, it } from "vitest";

import { getSessionStartAt } from "./session-datetime";
import { formatStudioDateTime, zonedTimeToUtc } from "./studio-timezone";

describe("session datetime in studio timezone", () => {
  it("interprets session date and time in Asia/Jakarta regardless of host timezone", () => {
    const sessionStart = getSessionStartAt({
      date: new Date("2026-07-09T00:00:00.000Z"),
      startTime: "19:00",
    });

    expect(sessionStart.toISOString()).toBe("2026-07-09T12:00:00.000Z");
  });

  it("formats cancel deadline consistently in studio local time", () => {
    const sessionStart = zonedTimeToUtc(2026, 7, 9, 19, 0);
    const cancelDeadline = new Date(sessionStart.getTime() - 24 * 60 * 60 * 1000);

    expect(formatStudioDateTime(cancelDeadline)).toBe("Jul 8, 2026, 7:00 PM");
  });
});
