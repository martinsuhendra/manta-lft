import { z } from "zod";

import { TRANSACTION_STATUS } from "@/lib/midtrans/constants";

const transactionStatusEnum = z.enum([
  TRANSACTION_STATUS.PENDING,
  TRANSACTION_STATUS.PROCESSING,
  TRANSACTION_STATUS.COMPLETED,
  TRANSACTION_STATUS.FAILED,
  TRANSACTION_STATUS.CANCELLED,
  TRANSACTION_STATUS.REFUNDED,
  TRANSACTION_STATUS.EXPIRED,
]);

export const manualTransactionSchema = z
  .object({
    userId: z.string().uuid().optional(),
    customerEmail: z.string().email("Invalid email address").optional(),
    customerName: z.string().min(1, "Name is required").optional(),
    customerPhone: z.string().optional(),
    productId: z.string().uuid("Please select a product"),
    amount: z.coerce.number().positive("Amount must be greater than zero"),
    status: transactionStatusEnum,
    paymentMethod: z.string().optional(),
    paymentProvider: z.string().optional(),
    paidAt: z.string().optional(),
    notes: z.string().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.userId) return;
    if (!value.customerEmail) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Email is required when no existing user is selected",
        path: ["customerEmail"],
      });
    }
    if (!value.customerName) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Name is required when no existing user is selected",
        path: ["customerName"],
      });
    }
  });

export const editTransactionSchema = z.object({
  amount: z.coerce.number().positive("Amount must be greater than zero"),
  status: transactionStatusEnum,
  paymentMethod: z.string().optional(),
  paymentProvider: z.string().optional(),
  paidAt: z.string().optional(),
  notes: z.string().optional(),
});

export interface TransactionListItem extends Record<string, unknown> {
  id: string;
  name: string;
  email: string | null;
  phoneNo: string | null;
  userId: string;
  userName: string;
  productName: string;
  productId: string;
  amount: number;
  currency: string;
  status: string;
  paymentMethod: string | null;
  paymentProvider: string | null;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
  listPrice?: number | null;
  productDiscountAmount?: number | null;
  promoDiscountAmount?: number | null;
  promoCode?: string | null;
}

export interface TransactionMembershipSummary {
  id: string;
  status: string;
  joinDate: string;
  expiredAt: string;
}

export interface TransactionDetail extends TransactionListItem {
  externalId: string | null;
  metadata: Record<string, unknown> | null;
  memberships: TransactionMembershipSummary[];
}

export type ManualTransactionFormValues = z.infer<typeof manualTransactionSchema>;
export type EditTransactionFormValues = z.infer<typeof editTransactionSchema>;
