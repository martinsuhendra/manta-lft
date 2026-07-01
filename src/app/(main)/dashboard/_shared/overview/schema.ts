import { z } from "zod";

export const todaySessionSchema = z.object({
  id: z.string(),
  time: z.string(),
  className: z.string(),
  teacher: z.string(),
  booked: z.number(),
  capacity: z.number(),
  status: z.enum(["SCHEDULED", "COMPLETED", "CANCELLED"]),
});

export const expiringMembershipSchema = z.object({
  id: z.string(),
  member: z.string(),
  product: z.string(),
  expiresAt: z.string(),
  daysLeft: z.number(),
});

export const recentTransactionSchema = z.object({
  id: z.string(),
  member: z.string(),
  product: z.string(),
  amount: z.number(),
  status: z.enum(["COMPLETED", "PENDING", "FAILED", "PROCESSING"]),
  paidAt: z.string(),
});

export const freezeRequestSchema = z.object({
  id: z.string(),
  member: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  status: z.enum(["PENDING", "APPROVED", "REJECTED"]),
});

export const lowFillSessionSchema = z.object({
  id: z.string(),
  session: z.string(),
  date: z.string(),
  fillPercent: z.number(),
  spotsLeft: z.number(),
});

export type TodaySession = z.infer<typeof todaySessionSchema>;
export type ExpiringMembership = z.infer<typeof expiringMembershipSchema>;
export type RecentTransaction = z.infer<typeof recentTransactionSchema>;
export type FreezeRequest = z.infer<typeof freezeRequestSchema>;
export type LowFillSession = z.infer<typeof lowFillSessionSchema>;

export interface DashboardKpi {
  revenue: { value: number; deltaPercent: number };
  activeMembers: { value: number; deltaPercent: number; newCount: number; churnedCount: number };
  checkIns: { value: number; deltaPercent: number };
  fillRate: { value: number; target: number };
  newSignups: { value: number; deltaPercent: number };
  actionNeeded: { value: number };
}

export interface DashboardQuickStats {
  payrollCostMtd: number;
  noShowRate: number;
  waitlistCount: number;
  unsignedWaivers: number;
}

export interface DashboardOverview {
  kpi: DashboardKpi;
  revenueByMonth: { month: string; income: number; checkIns: number }[];
  revenueSummary: { income: number; refunds: number; pending: number };
  membershipStatus: { status: string; count: number; fill: string }[];
  revenueByProduct: { product: string; revenue: number; percentage: number }[];
  attendanceByItem: { item: string; checkIns: number; percentage: number }[];
  sessionsByStatus: { day: string; scheduled: number; completed: number; cancelled: number }[];
  peakHours: { hour: string; bookings: number }[];
  teacherWorkload: { teacher: string; sessions: number; fillPercent: number }[];
  todaySessions: TodaySession[];
  expiringMemberships: ExpiringMembership[];
  recentTransactions: RecentTransaction[];
  freezeRequests: FreezeRequest[];
  lowFillSessions: LowFillSession[];
  quickStats: DashboardQuickStats;
  memberGrowthWeekly: { week: string; newMembers: number; churned: number }[];
  checkInsSparkline: { day: string; checkIns: number }[];
  signupsWeekly: { week: string; signups: number }[];
}
