import { z } from "zod";

// Helper function to convert time string to minutes (still used by updateSessionSchema)
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

// Session schemas extending from existing ClassSession model
export const sessionSchema = z.object({
  id: z.string(),
  itemId: z.string(),
  teacherId: z.string().nullable(),
  visibility: z.enum(["PUBLIC", "PRIVATE"]),
  date: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  status: z.enum(["SCHEDULED", "CANCELLED", "COMPLETED"]),
  notes: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  item: z.object({
    id: z.string(),
    name: z.string(),
    duration: z.number(),
    capacity: z.number(),
    color: z.string().nullable(),
  }),
  teacher: z
    .object({
      id: z.string(),
      name: z.string().nullable(),
      email: z.string().nullable(),
    })
    .nullable(),
  totalParticipantSlots: z.number().optional(),
  _count: z
    .object({
      bookings: z.number(),
    })
    .optional(),
  bookings: z
    .array(
      z.object({
        id: z.string(),
        status: z.enum(["RESERVED", "CHECKED_IN", "CANCELLED", "COMPLETED", "NO_SHOW", "WAITLISTED"]),
        user: z.object({
          id: z.string(),
          name: z.string().nullable(),
          email: z.string().nullable(),
        }),
      }),
    )
    .optional(),
});

export type Session = z.infer<typeof sessionSchema>;

export const createSessionSchema = z.object({
  itemId: z.string().min(1, "Item is required"),
  teacherId: z.string().optional(),
  visibility: z.enum(["PUBLIC", "PRIVATE"]).default("PUBLIC"),
  date: z.string().min(1, "Date is required"),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format"),
  status: z.enum(["SCHEDULED", "CANCELLED", "COMPLETED"]).default("SCHEDULED"),
  notes: z.string().optional(),
});

export type CreateSessionForm = z.infer<typeof createSessionSchema>;

export const updateSessionSchema = z
  .object({
    itemId: z.string().min(1, "Item is required").optional(),
    teacherId: z.string().optional(),
    date: z.string().min(1, "Date is required").optional(),
    startTime: z
      .string()
      .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format")
      .optional(),
    endTime: z
      .string()
      .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format")
      .optional(),
    status: z.enum(["SCHEDULED", "CANCELLED", "COMPLETED"]).optional(),
    visibility: z.enum(["PUBLIC", "PRIVATE"]).optional(),
    notes: z.string().optional(),
  })
  .refine(
    (data) => {
      if (!data.startTime || !data.endTime) return true; // Skip validation if either is not provided
      const startMinutes = timeToMinutes(data.startTime);
      const endMinutes = timeToMinutes(data.endTime);
      return endMinutes > startMinutes;
    },
    {
      message: "End time must be after start time",
      path: ["endTime"],
    },
  );

export type UpdateSessionForm = z.infer<typeof updateSessionSchema>;

// Item schema for dropdowns
export const itemOptionSchema = z.object({
  id: z.string(),
  name: z.string(),
  duration: z.number(),
  capacity: z.number(),
  color: z.string().nullable(),
});

export type ItemOption = z.infer<typeof itemOptionSchema>;

// Teacher schema for dropdowns
export const teacherOptionSchema = z.object({
  id: z.string(),
  name: z.string().nullable(),
  email: z.string().nullable(),
});

export type TeacherOption = z.infer<typeof teacherOptionSchema>;

// Session filter schema
export const sessionFilterSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  teacherId: z.string().optional(),
  itemId: z.string().optional(),
  status: z.enum(["SCHEDULED", "CANCELLED", "COMPLETED"]).optional(),
  visibility: z.enum(["PUBLIC", "PRIVATE"]).optional(),
});

export type SessionFilter = z.infer<typeof sessionFilterSchema>;

// Session status labels and colors
export const SESSION_STATUS_LABELS = {
  SCHEDULED: "Scheduled",
  CANCELLED: "Cancelled",
  COMPLETED: "Completed",
} as const;

export const SESSION_STATUS_COLORS = {
  SCHEDULED: "#3B82F6", // Blue
  CANCELLED: "#EF4444", // Red
  COMPLETED: "#10B981", // Green
} as const;

export type SessionStatusKey = keyof typeof SESSION_STATUS_LABELS;

export function getSessionStatusLabel(status: SessionStatusKey): string {
  switch (status) {
    case "SCHEDULED":
      return SESSION_STATUS_LABELS.SCHEDULED;
    case "CANCELLED":
      return SESSION_STATUS_LABELS.CANCELLED;
    case "COMPLETED":
      return SESSION_STATUS_LABELS.COMPLETED;
  }
}

export function getSessionStatusColor(status: SessionStatusKey): string {
  switch (status) {
    case "SCHEDULED":
      return SESSION_STATUS_COLORS.SCHEDULED;
    case "CANCELLED":
      return SESSION_STATUS_COLORS.CANCELLED;
    case "COMPLETED":
      return SESSION_STATUS_COLORS.COMPLETED;
  }
}

export const SESSION_VISIBILITY_LABELS = {
  PUBLIC: "Public",
  PRIVATE: "Private",
} as const;

// Time slots for scheduling (15-minute intervals)
export const TIME_SLOTS = Array.from({ length: 24 * 4 }, (_, i) => {
  const hour = Math.floor(i / 4);
  const minute = (i % 4) * 15;
  return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
});

// Calendar event schema for display
export const calendarEventSchema = z.object({
  id: z.string(),
  title: z.string(),
  start: z.date(),
  end: z.date(),
  color: z.string(),
  textColor: z.string().optional(),
  extendedProps: z.object({
    sessionId: z.string(),
    itemId: z.string(),
    teacherId: z.string().nullable(),
    status: z.enum(["SCHEDULED", "CANCELLED", "COMPLETED"]),
    capacity: z.number(),
    bookingCount: z.number(),
    notes: z.string().nullable(),
  }),
});

export type CalendarEvent = z.infer<typeof calendarEventSchema>;

// Eligible membership schema for add participant
export const eligibleMembershipSchema = z.object({
  id: z.string(),
  userId: z.string(),
  productId: z.string(),
  status: z.string(),
  expiredAt: z.date(),
  product: z.object({
    id: z.string(),
    name: z.string(),
  }),
  isEligible: z.boolean(),
  reason: z.string(),
  remainingQuota: z.number().nullable(),
});

export type EligibleMembership = z.infer<typeof eligibleMembershipSchema>;

// Member with eligible memberships
export const eligibleMemberSchema = z.object({
  id: z.string(),
  name: z.string().nullable(),
  email: z.string().nullable(),
  memberships: z.array(eligibleMembershipSchema),
});

export type EligibleMember = z.infer<typeof eligibleMemberSchema>;

// Add participant form schema
export const addParticipantSchema = z.object({
  userId: z.string().min(1, "User is required"),
  membershipId: z.string().min(1, "Membership is required"),
});

export type AddParticipantForm = z.infer<typeof addParticipantSchema>;
