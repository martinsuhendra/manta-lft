import { NextRequest, NextResponse } from "next/server";

import { z } from "zod";

import { requireAdmin } from "@/lib/api-utils";
import { prisma } from "@/lib/generated/prisma";
import { MEMBERSHIP_STATUS, SUSPENDED_TRANSACTION_STATUSES, TRANSACTION_STATUS } from "@/lib/midtrans/constants";

const transactionStatusSchema = z.enum([
  TRANSACTION_STATUS.PENDING,
  TRANSACTION_STATUS.PROCESSING,
  TRANSACTION_STATUS.COMPLETED,
  TRANSACTION_STATUS.FAILED,
  TRANSACTION_STATUS.CANCELLED,
  TRANSACTION_STATUS.REFUNDED,
  TRANSACTION_STATUS.EXPIRED,
]);

const updateTransactionSchema = z.object({
  amount: z.number().positive().optional(),
  status: transactionStatusSchema.optional(),
  paymentMethod: z.string().nullable().optional(),
  paymentProvider: z.string().nullable().optional(),
  paidAt: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

function getMembershipStatusFromTransactionStatus(status: string) {
  if (status === TRANSACTION_STATUS.COMPLETED) return MEMBERSHIP_STATUS.ACTIVE;
  if (SUSPENDED_TRANSACTION_STATUSES.includes(status as (typeof SUSPENDED_TRANSACTION_STATUSES)[number]))
    return MEMBERSHIP_STATUS.SUSPENDED;
  return MEMBERSHIP_STATUS.PENDING;
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { error: authError } = await requireAdmin();
    if (authError) return authError;

    const { id } = await params;
    const transaction = await prisma.transaction.findUnique({
      where: { id },
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
        memberships: {
          select: {
            id: true,
            status: true,
            joinDate: true,
            expiredAt: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!transaction) return NextResponse.json({ error: "Transaction not found" }, { status: 404 });

    return NextResponse.json({
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
      externalId: transaction.externalId,
      metadata: (transaction.metadata as Record<string, unknown> | null) ?? null,
      paidAt: transaction.paidAt?.toISOString() ?? null,
      createdAt: transaction.createdAt.toISOString(),
      updatedAt: transaction.updatedAt.toISOString(),
      memberships: transaction.memberships.map((membership) => ({
        id: membership.id,
        status: membership.status,
        joinDate: membership.joinDate.toISOString(),
        expiredAt: membership.expiredAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Failed to fetch transaction detail:", error);
    return NextResponse.json({ error: "Failed to fetch transaction detail" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { error: authError } = await requireAdmin();
    if (authError) return authError;

    const { id } = await params;
    const body = await request.json();
    const validated = updateTransactionSchema.parse(body);

    const existing = await prisma.transaction.findUnique({
      where: { id },
      select: { id: true, status: true, metadata: true },
    });
    if (!existing) return NextResponse.json({ error: "Transaction not found" }, { status: 404 });

    const paidAt = validated.paidAt !== undefined ? (validated.paidAt ? new Date(validated.paidAt) : null) : undefined;
    const nextStatus = validated.status ?? existing.status;
    const nextMembershipStatus = getMembershipStatusFromTransactionStatus(nextStatus);
    const nextMetadata =
      validated.notes === undefined
        ? existing.metadata
        : {
            ...((existing.metadata as Record<string, unknown> | null) ?? {}),
            notes: validated.notes,
          };

    await prisma.$transaction(async (tx) => {
      await tx.transaction.update({
        where: { id },
        data: {
          ...(validated.amount !== undefined ? { amount: validated.amount } : {}),
          ...(validated.status !== undefined ? { status: validated.status } : {}),
          ...(validated.paymentMethod !== undefined ? { paymentMethod: validated.paymentMethod } : {}),
          ...(validated.paymentProvider !== undefined ? { paymentProvider: validated.paymentProvider } : {}),
          ...(paidAt !== undefined ? { paidAt } : {}),
          ...(validated.notes !== undefined ? { metadata: JSON.parse(JSON.stringify(nextMetadata)) } : {}),
        },
      });

      if (validated.status !== undefined) {
        await tx.membership.updateMany({
          where: { transactionId: id },
          data: { status: nextMembershipStatus },
        });
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError)
      return NextResponse.json({ error: "Validation failed", details: error.flatten() }, { status: 400 });

    console.error("Failed to update transaction:", error);
    return NextResponse.json({ error: "Failed to update transaction" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { error: authError } = await requireAdmin();
    if (authError) return authError;

    const { id } = await params;
    const existing = await prisma.transaction.findUnique({
      where: { id },
      select: {
        id: true,
        memberships: {
          select: {
            id: true,
            _count: {
              select: { bookings: true },
            },
          },
        },
      },
    });
    if (!existing) return NextResponse.json({ error: "Transaction not found" }, { status: 404 });

    const membershipWithBookings = existing.memberships.find((membership) => membership._count.bookings > 0);
    if (membershipWithBookings) {
      return NextResponse.json(
        { error: "Cannot delete transaction with memberships that already have bookings" },
        { status: 400 },
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.membership.deleteMany({
        where: { transactionId: id },
      });
      await tx.transaction.delete({
        where: { id },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete transaction:", error);
    return NextResponse.json({ error: "Failed to delete transaction" }, { status: 500 });
  }
}
