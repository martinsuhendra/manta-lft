import { createPaymentSuccessTemplate } from "@/lib/email/payment-templates";
import { emailService } from "@/lib/email/service";
import { prisma } from "@/lib/generated/prisma";

import {
  MEMBERSHIP_STATUS,
  SUSPENDED_TRANSACTION_STATUSES,
  TRANSACTION_STATUS,
  type TransactionStatus,
} from "./constants";
import { getTransactionStatus, mapMidtransStatus, verifySignature } from "./snap";
import type { MidtransNotification, TransactionMetadata } from "./types";

interface TransactionWithRelations {
  id: string;
  status: string;
  amount: { toString(): string };
  currency: string;
  paymentMethod: string | null;
  paidAt: Date | null;
  metadata: unknown;
  user: {
    id: string;
    name: string | null;
    email: string | null;
  };
  product: {
    id: string;
    name: string;
  };
  memberships: Array<{ id: string }>;
}

function getAccountUrl() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL;
  if (!appUrl) return "/public/my-account";
  return `${appUrl.replace(/\/$/, "")}/public/my-account`;
}

/**
 * Verify webhook signature and transaction status
 */
export async function verifyWebhook(notification: MidtransNotification): Promise<TransactionStatus> {
  // Step 1: Verify signature
  verifySignature({
    orderId: notification.order_id,
    statusCode: notification.status_code,
    grossAmount: notification.gross_amount,
    signatureKey: notification.signature_key,
  });

  // Step 2: Verify with Midtrans API (defense in depth - don't trust notification alone)
  const transactionStatus = await getTransactionStatus(notification.order_id);

  // Step 3: Map to internal status
  return mapMidtransStatus(transactionStatus.transaction_status, transactionStatus.fraud_status);
}

/**
 * Update transaction status and metadata
 */
export async function updateTransaction(
  transactionId: string,
  newStatus: TransactionStatus,
  notification: MidtransNotification,
  existingMetadata: unknown,
) {
  const metadata: TransactionMetadata = {
    ...(existingMetadata as TransactionMetadata),
    midtransNotification: notification,
    lastWebhookAt: new Date().toISOString(),
  };

  return prisma.transaction.update({
    where: { id: transactionId },
    data: {
      status: newStatus,
      paymentMethod: notification.payment_type,
      paymentProvider: "midtrans",
      externalId: notification.transaction_id,
      paidAt: notification.settlement_time ? new Date(notification.settlement_time) : null,
      metadata: JSON.parse(JSON.stringify(metadata)),
    },
  });
}

/**
 * Handle membership status based on transaction status
 */
export async function updateMembershipStatus(transactionId: string, newStatus: TransactionStatus) {
  if (newStatus === TRANSACTION_STATUS.COMPLETED) {
    return activateMemberships(transactionId);
  }

  if (SUSPENDED_TRANSACTION_STATUSES.includes(newStatus)) {
    return suspendMemberships(transactionId);
  }

  return { count: 0 };
}

/**
 * Activate memberships for completed transactions
 */
async function activateMemberships(transactionId: string) {
  return prisma.membership.updateMany({
    where: {
      transactionId,
      status: { in: [MEMBERSHIP_STATUS.PENDING, MEMBERSHIP_STATUS.SUSPENDED] },
    },
    data: {
      status: MEMBERSHIP_STATUS.ACTIVE,
    },
  });
}

/**
 * Suspend memberships for failed/cancelled/expired/refunded transactions
 */
async function suspendMemberships(transactionId: string) {
  return prisma.membership.updateMany({
    where: {
      transactionId,
      status: { in: [MEMBERSHIP_STATUS.PENDING, MEMBERSHIP_STATUS.ACTIVE] },
    },
    data: {
      status: MEMBERSHIP_STATUS.SUSPENDED,
    },
  });
}

/**
 * Sync transaction + membership status from Midtrans (client callback after Snap payment).
 * Does not send email — webhook handles notifications.
 */
export async function syncTransactionFromMidtrans(transactionId: string) {
  const transaction = await prisma.transaction.findUnique({
    where: { id: transactionId },
  });

  if (!transaction) {
    throw new Error("Transaction not found");
  }

  const statusResponse = await getTransactionStatus(transactionId);
  const newStatus = mapMidtransStatus(statusResponse.transaction_status, statusResponse.fraud_status);

  if (transaction.status === newStatus) {
    return { status: newStatus, changed: false };
  }

  const notification: MidtransNotification = {
    transaction_time: statusResponse.transaction_time,
    transaction_status: statusResponse.transaction_status,
    transaction_id: statusResponse.transaction_id,
    status_message: statusResponse.status_message,
    status_code: statusResponse.status_code,
    signature_key: "",
    settlement_time: statusResponse.settlement_time,
    payment_type: statusResponse.payment_type,
    order_id: statusResponse.order_id,
    merchant_id: "",
    gross_amount: statusResponse.gross_amount,
    fraud_status: statusResponse.fraud_status,
    currency: statusResponse.currency,
  };

  await updateTransaction(transactionId, newStatus, notification, transaction.metadata);
  await updateMembershipStatus(transactionId, newStatus);

  return { status: newStatus, changed: true };
}

/**
 * Send payment success email notification
 */
export async function sendPaymentSuccessEmail(transaction: TransactionWithRelations) {
  if (!transaction.user.email) {
    console.warn("Cannot send email: user email not found");
    return;
  }

  try {
    const emailTemplate = await createPaymentSuccessTemplate({
      userName: transaction.user.name || undefined,
      productName: transaction.product.name,
      accountUrl: getAccountUrl(),
      amount: Number(transaction.amount),
      currency: transaction.currency,
      transactionId: transaction.id,
      paidAt: transaction.paidAt,
      paymentMethod: transaction.paymentMethod,
    });

    await emailService.sendEmail(transaction.user.email, emailTemplate);

    console.log("Payment success email sent:", {
      email: transaction.user.email,
      transactionId: transaction.id,
    });
  } catch (error) {
    // Log but don't throw - email failures shouldn't fail the webhook
    console.error("Failed to send payment success email:", {
      error,
      transactionId: transaction.id,
      email: transaction.user.email,
    });
  }
}
