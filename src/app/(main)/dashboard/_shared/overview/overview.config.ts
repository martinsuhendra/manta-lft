import type { DashboardOverview } from "@/app/(main)/dashboard/_shared/overview/schema";
import type { ChartConfig } from "@/components/ui/chart";

export const memberGrowthChartConfig = {
  newMembers: { label: "New", color: "var(--chart-1)" },
  churned: { label: "Churned", color: "var(--chart-3)" },
  background: { color: "var(--primary)" },
} as ChartConfig;

export const checkInsSparklineConfig = {
  checkIns: { label: "Check-ins", color: "var(--chart-2)" },
} as ChartConfig;

export const signupsSparklineConfig = {
  signups: { label: "Signups", color: "var(--chart-4)" },
} as ChartConfig;

export const revenueByMonthChartConfig = {
  income: { label: "Income", color: "var(--chart-1)" },
  checkIns: { label: "Check-ins", color: "var(--chart-2)" },
} as ChartConfig;

export const membershipStatusChartConfig = {
  count: { label: "Members" },
  ACTIVE: { label: "Active", color: "var(--chart-1)" },
  FREEZED: { label: "Frozen", color: "var(--chart-2)" },
  EXPIRED: { label: "Expired", color: "var(--chart-3)" },
  PENDING: { label: "Pending", color: "var(--chart-4)" },
} as ChartConfig;

export const revenueByProductChartConfig = {
  revenue: { label: "Revenue", color: "var(--chart-1)" },
} as ChartConfig;

export const attendanceByItemChartConfig = {
  checkIns: { label: "Check-ins", color: "var(--chart-2)" },
} as ChartConfig;

export const sessionsByStatusChartConfig = {
  scheduled: { label: "Scheduled", color: "var(--chart-4)" },
  completed: { label: "Completed", color: "var(--chart-1)" },
  cancelled: { label: "Cancelled", color: "var(--chart-3)" },
} as ChartConfig;

export const peakHoursChartConfig = {
  bookings: { label: "Bookings", color: "var(--chart-1)" },
} as ChartConfig;

export const dashboardOverviewMock: DashboardOverview = {
  kpi: {
    revenue: { value: 48_750_000, deltaPercent: 14.2 },
    activeMembers: { value: 312, deltaPercent: 6.8, newCount: 28, churnedCount: 9 },
    checkIns: { value: 847, deltaPercent: 11.4 },
    fillRate: { value: 72, target: 75 },
    newSignups: { value: 34, deltaPercent: 9.1 },
    actionNeeded: { value: 12 },
  },
  revenueByMonth: [
    { month: "Oct", income: 38_200_000, checkIns: 620 },
    { month: "Nov", income: 41_500_000, checkIns: 710 },
    { month: "Dec", income: 44_100_000, checkIns: 780 },
    { month: "Jan", income: 42_800_000, checkIns: 695 },
    { month: "Feb", income: 45_600_000, checkIns: 760 },
    { month: "Mar", income: 48_750_000, checkIns: 847 },
  ],
  revenueSummary: {
    income: 48_750_000,
    refunds: 1_250_000,
    pending: 3_400_000,
  },
  membershipStatus: [
    { status: "ACTIVE", count: 312, fill: "var(--color-ACTIVE)" },
    { status: "FREEZED", count: 18, fill: "var(--color-FREEZED)" },
    { status: "EXPIRED", count: 45, fill: "var(--color-EXPIRED)" },
    { status: "PENDING", count: 12, fill: "var(--color-PENDING)" },
  ],
  revenueByProduct: [
    { product: "Monthly Unlimited", revenue: 18_500_000, percentage: 38 },
    { product: "Hyrox 12-Pack", revenue: 12_200_000, percentage: 25 },
    { product: "CrossFit 8-Pack", revenue: 9_800_000, percentage: 20 },
    { product: "Open Gym Pass", revenue: 5_400_000, percentage: 11 },
    { product: "Trial Week", revenue: 2_850_000, percentage: 6 },
  ],
  attendanceByItem: [
    { item: "Hyrox Engine", checkIns: 245, percentage: 29 },
    { item: "CrossFit WOD", checkIns: 198, percentage: 23 },
    { item: "Open Gym", checkIns: 156, percentage: 18 },
    { item: "Strength Fundamentals", checkIns: 132, percentage: 16 },
    { item: "Mobility & Recovery", checkIns: 116, percentage: 14 },
  ],
  sessionsByStatus: [
    { day: "Mon", scheduled: 4, completed: 18, cancelled: 1 },
    { day: "Tue", scheduled: 3, completed: 20, cancelled: 0 },
    { day: "Wed", scheduled: 5, completed: 19, cancelled: 2 },
    { day: "Thu", scheduled: 4, completed: 21, cancelled: 1 },
    { day: "Fri", scheduled: 6, completed: 22, cancelled: 0 },
    { day: "Sat", scheduled: 8, completed: 16, cancelled: 1 },
    { day: "Sun", scheduled: 3, completed: 12, cancelled: 0 },
  ],
  peakHours: [
    { hour: "6am", bookings: 42 },
    { hour: "8am", bookings: 68 },
    { hour: "10am", bookings: 45 },
    { hour: "12pm", bookings: 38 },
    { hour: "5pm", bookings: 92 },
    { hour: "7pm", bookings: 78 },
  ],
  teacherWorkload: [
    { teacher: "Sarah Chen", sessions: 24, fillPercent: 88 },
    { teacher: "Marcus Webb", sessions: 22, fillPercent: 82 },
    { teacher: "Diana Putri", sessions: 18, fillPercent: 76 },
    { teacher: "James Okonkwo", sessions: 16, fillPercent: 71 },
    { teacher: "Lina Hartono", sessions: 14, fillPercent: 65 },
  ],
  memberGrowthWeekly: [
    { week: "W1", newMembers: 6, churned: 2 },
    { week: "W2", newMembers: 8, churned: 3 },
    { week: "W3", newMembers: 5, churned: 1 },
    { week: "W4", newMembers: 9, churned: 3 },
  ],
  checkInsSparkline: [
    { day: "Mon", checkIns: 118 },
    { day: "Tue", checkIns: 132 },
    { day: "Wed", checkIns: 125 },
    { day: "Thu", checkIns: 140 },
    { day: "Fri", checkIns: 156 },
    { day: "Sat", checkIns: 98 },
    { day: "Sun", checkIns: 78 },
  ],
  signupsWeekly: [
    { week: "W1", signups: 7 },
    { week: "W2", signups: 9 },
    { week: "W3", signups: 6 },
    { week: "W4", signups: 12 },
  ],
  todaySessions: [
    {
      id: "1",
      time: "06:00",
      className: "Hyrox Engine",
      teacher: "Sarah Chen",
      booked: 14,
      capacity: 16,
      status: "SCHEDULED",
    },
    {
      id: "2",
      time: "07:30",
      className: "CrossFit WOD",
      teacher: "Marcus Webb",
      booked: 12,
      capacity: 14,
      status: "SCHEDULED",
    },
    {
      id: "3",
      time: "09:00",
      className: "Open Gym",
      teacher: "Diana Putri",
      booked: 8,
      capacity: 20,
      status: "SCHEDULED",
    },
    {
      id: "4",
      time: "12:00",
      className: "Strength Fundamentals",
      teacher: "James Okonkwo",
      booked: 10,
      capacity: 12,
      status: "SCHEDULED",
    },
    {
      id: "5",
      time: "17:00",
      className: "Hyrox Engine",
      teacher: "Sarah Chen",
      booked: 16,
      capacity: 16,
      status: "SCHEDULED",
    },
    {
      id: "6",
      time: "18:30",
      className: "CrossFit WOD",
      teacher: "Lina Hartono",
      booked: 11,
      capacity: 14,
      status: "SCHEDULED",
    },
    {
      id: "7",
      time: "19:30",
      className: "Mobility & Recovery",
      teacher: "Diana Putri",
      booked: 6,
      capacity: 12,
      status: "SCHEDULED",
    },
    {
      id: "8",
      time: "20:30",
      className: "Open Gym",
      teacher: "Marcus Webb",
      booked: 4,
      capacity: 20,
      status: "SCHEDULED",
    },
  ],
  expiringMemberships: [
    { id: "e1", member: "Andi Pratama", product: "Monthly Unlimited", expiresAt: "2026-07-05", daysLeft: 4 },
    { id: "e2", member: "Rina Wijaya", product: "Hyrox 12-Pack", expiresAt: "2026-07-08", daysLeft: 7 },
    { id: "e3", member: "Tommy Hartono", product: "CrossFit 8-Pack", expiresAt: "2026-07-10", daysLeft: 9 },
    { id: "e4", member: "Siti Rahayu", product: "Monthly Unlimited", expiresAt: "2026-07-12", daysLeft: 11 },
    { id: "e5", member: "Kevin Tan", product: "Open Gym Pass", expiresAt: "2026-07-14", daysLeft: 13 },
  ],
  recentTransactions: [
    {
      id: "t1",
      member: "Jessica Lee",
      product: "Monthly Unlimited",
      amount: 1_850_000,
      status: "COMPLETED",
      paidAt: "2026-07-01 09:12",
    },
    {
      id: "t2",
      member: "Budi Santoso",
      product: "Hyrox 12-Pack",
      amount: 2_400_000,
      status: "COMPLETED",
      paidAt: "2026-07-01 08:45",
    },
    {
      id: "t3",
      member: "Emma Wilson",
      product: "Trial Week",
      amount: 350_000,
      status: "PENDING",
      paidAt: "2026-07-01 08:30",
    },
    {
      id: "t4",
      member: "Daniel Kim",
      product: "CrossFit 8-Pack",
      amount: 1_600_000,
      status: "COMPLETED",
      paidAt: "2026-06-30 19:22",
    },
    {
      id: "t5",
      member: "Maya Sari",
      product: "Monthly Unlimited",
      amount: 1_850_000,
      status: "FAILED",
      paidAt: "2026-06-30 17:10",
    },
  ],
  freezeRequests: [
    { id: "f1", member: "Ahmad Rizki", startDate: "2026-07-05", endDate: "2026-07-19", status: "PENDING" },
    { id: "f2", member: "Clara Nguyen", startDate: "2026-07-08", endDate: "2026-07-22", status: "PENDING" },
    { id: "f3", member: "Hendra Wijaya", startDate: "2026-06-28", endDate: "2026-07-12", status: "APPROVED" },
  ],
  lowFillSessions: [
    { id: "l1", session: "Mobility & Recovery", date: "Jul 2, 10:00", fillPercent: 33, spotsLeft: 8 },
    { id: "l2", session: "Open Gym", date: "Jul 2, 20:30", fillPercent: 20, spotsLeft: 16 },
    { id: "l3", session: "Strength Fundamentals", date: "Jul 3, 07:00", fillPercent: 42, spotsLeft: 7 },
    { id: "l4", session: "Hyrox Engine", date: "Jul 3, 11:00", fillPercent: 50, spotsLeft: 8 },
  ],
  quickStats: {
    payrollCostMtd: 18_600_000,
    noShowRate: 4.2,
    waitlistCount: 23,
    unsignedWaivers: 7,
  },
};
