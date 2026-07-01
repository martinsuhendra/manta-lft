import { describe, expect, it } from "vitest";

import { dashboardOverviewMock } from "./overview.config";
import {
  expiringMembershipSchema,
  freezeRequestSchema,
  lowFillSessionSchema,
  recentTransactionSchema,
  todaySessionSchema,
} from "./schema";

describe("dashboard overview schemas", () => {
  it("validates mock today sessions", () => {
    for (const row of dashboardOverviewMock.todaySessions) {
      expect(todaySessionSchema.safeParse(row).success).toBe(true);
    }
  });

  it("validates mock expiring memberships", () => {
    for (const row of dashboardOverviewMock.expiringMemberships) {
      expect(expiringMembershipSchema.safeParse(row).success).toBe(true);
    }
  });

  it("validates mock transactions", () => {
    for (const row of dashboardOverviewMock.recentTransactions) {
      expect(recentTransactionSchema.safeParse(row).success).toBe(true);
    }
  });

  it("validates mock freeze requests", () => {
    for (const row of dashboardOverviewMock.freezeRequests) {
      expect(freezeRequestSchema.safeParse(row).success).toBe(true);
    }
  });

  it("validates mock low fill sessions", () => {
    for (const row of dashboardOverviewMock.lowFillSessions) {
      expect(lowFillSessionSchema.safeParse(row).success).toBe(true);
    }
  });
});
