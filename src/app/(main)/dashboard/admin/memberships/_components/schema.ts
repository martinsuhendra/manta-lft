import { z } from "zod";

export const membershipSchema = z.object({
  id: z.string(),
  userId: z.string(),
  productId: z.string(),
  status: z.string(),
  joinDate: z.string(),
  expiredAt: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  user: z.object({
    id: z.string(),
    name: z.string().nullable(),
    email: z.string().nullable(),
    phoneNo: z.string().nullable(),
  }),
  product: z.object({
    id: z.string(),
    name: z.string(),
    price: z.number(),
    validDays: z.number(),
  }),
  transaction: z
    .object({
      id: z.string(),
      status: z.string(),
      amount: z.union([z.number(), z.string()]),
      paidAt: z.string().nullable().optional(),
    })
    .nullable()
    .optional(),
});

export type Membership = z.infer<typeof membershipSchema>;

export const createMembershipSchema = z.object({
  userId: z.string().min(1, "User is required"),
  productId: z.string().min(1, "Product is required"),
  status: z.enum(["ACTIVE", "FREEZED", "EXPIRED", "SUSPENDED", "PENDING"]).default("ACTIVE"),
  joinDate: z.string().optional(),
});

export type CreateMembershipForm = z.infer<typeof createMembershipSchema>;

export const updateMembershipSchema = z.object({
  status: z.enum(["ACTIVE", "FREEZED", "EXPIRED", "SUSPENDED", "PENDING"]).optional(),
  expiredAt: z.string().optional(),
});

export type UpdateMembershipForm = z.infer<typeof updateMembershipSchema>;
