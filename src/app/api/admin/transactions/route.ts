import { NextRequest, NextResponse } from "next/server";

import { z } from "zod";

import { requireAdmin } from "@/lib/api-utils";
import { prisma } from "@/lib/generated/prisma";
import { MEMBERSHIP_STATUS, SUSPENDED_TRANSACTION_STATUSES, TRANSACTION_STATUS } from "@/lib/midtrans/constants";
import { DEFAULT_USER_ROLE } from "@/lib/types";

const transactionStatusSchema = z.enum([
  TRANSACTION_STATUS.PENDING,
  TRANSACTION_STATUS.PROCESSING,
  TRANSACTION_STATUS.COMPLETED,
  TRANSACTION_STATUS.FAILED,
  TRANSACTION_STATUS.CANCELLED,
  TRANSACTION_STATUS.REFUNDED,
  TRANSACTION_STATUS.EXPIRED,
]);

const listTransactionsSchema = z.object({
  status: transactionStatusSchema.optional(),
  paymentMethod: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

const createTransactionSchema = z
  .object({
    userId: z.string().uuid().optional(),
    customerEmail: z.string().email().optional(),
    customerName: z.string().min(1).optional(),
    customerPhone: z.string().optional(),
    productId: z.string().uuid(),
    amount: z.number().positive(),
    status: transactionStatusSchema,
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
        message: "customerEmail is required when userId is not provided",
        path: ["customerEmail"],
      });
    }
    if (!value.customerName) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "customerName is required when userId is not provided",
        path: ["customerName"],
      });
    }
  });

function parseDateRange(startDate?: string, endDate?: string) {
  if (!startDate && !endDate) return undefined;

  const dateFilter: { gte?: Date; lte?: Date } = {};

  if (startDate) dateFilter.gte = new Date(`${startDate}T00:00:00.000Z`);
  if (endDate) dateFilter.lte = new Date(`${endDate}T23:59:59.999Z`);

  return dateFilter;
}

function getMembershipStatusFromTransactionStatus(status: string) {
  if (status === TRANSACTION_STATUS.COMPLETED) return MEMBERSHIP_STATUS.ACTIVE;
  if (SUSPENDED_TRANSACTION_STATUSES.includes(status as (typeof SUSPENDED_TRANSACTION_STATUSES)[number]))
    return MEMBERSHIP_STATUS.SUSPENDED;
  return MEMBERSHIP_STATUS.PENDING;
}

export async function GET(request: NextRequest) {
  try {
    const { error: authError } = await requireAdmin();
    if (authError) return authError;

    const query = listTransactionsSchema.parse({
      status: request.nextUrl.searchParams.get("status") ?? undefined,
      paymentMethod: request.nextUrl.searchParams.get("paymentMethod") ?? undefined,
      startDate: request.nextUrl.searchParams.get("startDate") ?? undefined,
      endDate: request.nextUrl.searchParams.get("endDate") ?? undefined,
    });

    const createdAt = parseDateRange(query.startDate, query.endDate);

    const transactions = await prisma.transaction.findMany({
      where: {
        ...(query.status ? { status: query.status } : {}),
        ...(query.paymentMethod
          ? {
              paymentMethod: {
                contains: query.paymentMethod,
                mode: "insensitive",
              },
            }
          : {}),
        ...(createdAt ? { createdAt } : {}),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phoneNo: true,
          },
        },
        product: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(
      transactions.map((transaction) => ({
        id: transaction.id,
        name: transaction.user.name ?? "",
        email: transaction.user.email,
        phoneNo: transaction.user.phoneNo,
        userId: transaction.user.id,
        userName: transaction.user.name ?? transaction.user.email ?? "Unknown User",
        productName: transaction.product.name,
        productId: transaction.product.id,
        amount: Number(transaction.amount),
        currency: transaction.currency,
        status: transaction.status,
        paymentMethod: transaction.paymentMethod,
        paymentProvider: transaction.paymentProvider,
        listPrice: transaction.listPrice != null ? Number(transaction.listPrice) : null,
        productDiscountAmount:
          transaction.productDiscountAmount != null ? Number(transaction.productDiscountAmount) : null,
        promoDiscountAmount: transaction.promoDiscountAmount != null ? Number(transaction.promoDiscountAmount) : null,
        promoCode: transaction.promoCode,
        paidAt: transaction.paidAt?.toISOString() ?? null,
        createdAt: transaction.createdAt.toISOString(),
        updatedAt: transaction.updatedAt.toISOString(),
      })),
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid query", details: error.flatten() }, { status: 400 });
    }
    console.error("Failed to fetch transactions:", error);
    return NextResponse.json({ error: "Failed to fetch transactions" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { error: authError } = await requireAdmin();
    if (authError) return authError;

    const body = await request.json();
    const validated = createTransactionSchema.parse(body);

    const product = await prisma.product.findUnique({
      where: { id: validated.productId },
      include: {
        productBrands: {
          select: { brandId: true },
          orderBy: { createdAt: "asc" },
        },
      },
    });
    if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });
    if (!product.isActive) return NextResponse.json({ error: "Product is not available" }, { status: 400 });

    const productBrandIds = product.productBrands.map((item) => item.brandId);
    if (!productBrandIds.length) {
      return NextResponse.json({ error: "Product is not linked to any brand" }, { status: 400 });
    }

    let user;
    if (validated.userId) {
      const existingUser = await prisma.user.findUnique({ where: { id: validated.userId } });
      if (!existingUser) return NextResponse.json({ error: "User not found" }, { status: 404 });
      user = existingUser;
    } else {
      const customerEmail = validated.customerEmail ?? "";
      const existingUser = await prisma.user.findUnique({ where: { email: customerEmail } });
      if (!existingUser) {
        user = await prisma.user.create({
          data: {
            email: customerEmail,
            name: validated.customerName ?? customerEmail.split("@")[0],
            phoneNo: validated.customerPhone ?? null,
            role: DEFAULT_USER_ROLE,
          },
        });
      } else {
        user = existingUser;
      }
    }

    const now = new Date();
    const paidAt =
      validated.status === TRANSACTION_STATUS.COMPLETED ? (validated.paidAt ? new Date(validated.paidAt) : now) : null;
    const expiredAt = new Date(now);
    expiredAt.setDate(expiredAt.getDate() + product.validDays);

    const created = await prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.create({
        data: {
          userId: user.id,
          productId: product.id,
          brandId: productBrandIds[0],
          amount: validated.amount,
          currency: "IDR",
          status: validated.status,
          paymentMethod: validated.paymentMethod || null,
          paymentProvider: validated.paymentProvider || "manual",
          paidAt,
          metadata: {
            createdBy: "admin-manual",
            notes: validated.notes ?? null,
          },
        },
      });

      const membership = await tx.membership.create({
        data: {
          userId: user.id,
          productId: product.id,
          status: getMembershipStatusFromTransactionStatus(validated.status),
          joinDate: now,
          expiredAt,
          transactionId: transaction.id,
          membershipBrands: {
            create: productBrandIds.map((brandId) => ({ brandId })),
          },
        },
      });

      return { transaction, membership };
    });

    return NextResponse.json(
      {
        success: true,
        transactionId: created.transaction.id,
        membershipId: created.membership.id,
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.flatten() }, { status: 400 });
    }
    console.error("Failed to create manual transaction:", error);
    return NextResponse.json({ error: "Failed to create transaction" }, { status: 500 });
  }
}
