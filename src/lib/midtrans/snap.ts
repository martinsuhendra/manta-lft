import crypto from "crypto";

import { MIDTRANS_CONFIG, SNAP_API_URL, STATUS_API_URL, validateMidtransConfig } from "./config";
import { TRANSACTION_STATUS, type TransactionStatus } from "./constants";
import { InvalidSignatureError, MidtransAPIError } from "./errors";
import type {
  MidtransSnapRequest,
  SnapTokenResponse,
  SnapTransactionParams,
  TransactionStatusResponse,
  VerifySignatureParams,
} from "./types";
import { midtransFetch, parseJsonResponse } from "./utils";

/**
 * Create a Snap transaction token
 * This token is used to open the Snap payment popup on the frontend
 */
export async function createSnapTransaction(params: SnapTransactionParams): Promise<SnapTokenResponse> {
  validateMidtransConfig();

  const finishCallbackUrl =
    params.finishCallbackUrl === undefined
      ? `${process.env.NEXT_PUBLIC_APP_URL}/public/my-account`
      : params.finishCallbackUrl;

  const payload: MidtransSnapRequest = {
    transaction_details: {
      order_id: params.transactionId,
      gross_amount: params.amount,
    },
    customer_details: {
      first_name: params.customerName,
      email: params.customerEmail,
      phone: params.customerPhone || "",
    },
    item_details: [
      {
        id: params.productId,
        price: params.amount,
        quantity: 1,
        name: params.productName,
      },
    ],
    ...(finishCallbackUrl ? { callbacks: { finish: finishCallbackUrl } } : {}),
  };

  try {
    const response = await midtransFetch(SNAP_API_URL, {
      method: "POST",
      body: JSON.stringify(payload),
    });

    const data = await parseJsonResponse<{
      token: string;
      redirect_url: string;
      error_messages?: string[];
    }>(response);

    if (!response.ok) {
      throw new MidtransAPIError(
        data.error_messages?.join(", ") || "Failed to create Snap transaction",
        response.status,
        data,
      );
    }

    return {
      token: data.token,
      redirect_url: data.redirect_url,
    };
  } catch (error) {
    if (error instanceof MidtransAPIError) {
      throw error;
    }
    throw new MidtransAPIError(
      `Failed to create Snap transaction: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

/**
 * Get transaction status from Midtrans
 * Used to verify webhook notifications
 */
export async function getTransactionStatus(orderId: string): Promise<TransactionStatusResponse> {
  validateMidtransConfig();

  const url = `${STATUS_API_URL}/${orderId}/status`;

  try {
    console.log("Fetching transaction status from Midtrans:", { url, orderId });

    const response = await midtransFetch(url, { method: "GET" });
    const data = await parseJsonResponse<TransactionStatusResponse>(response);

    if (!response.ok) {
      throw new MidtransAPIError(data.status_message || "Failed to get transaction status", response.status, data);
    }

    return data;
  } catch (error) {
    if (error instanceof MidtransAPIError) {
      throw error;
    }
    throw new MidtransAPIError(
      `Failed to get transaction status: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

/**
 * Verify webhook notification signature
 * Midtrans uses SHA512(order_id + status_code + gross_amount + server_key)
 * This prevents webhook spoofing attacks
 */
export function verifySignature(params: VerifySignatureParams): boolean {
  validateMidtransConfig();

  const { orderId, statusCode, grossAmount, signatureKey } = params;

  // Create signature string: order_id + status_code + gross_amount + server_key
  const signatureString = `${orderId}${statusCode}${grossAmount}${MIDTRANS_CONFIG.serverKey}`;

  // Hash with SHA512
  const hash = crypto.createHash("sha512").update(signatureString).digest("hex");

  // Compare with signature from notification (timing-safe to prevent timing attacks)
  const hashBuf = Buffer.from(hash, "utf8");
  const sigBuf = Buffer.from(signatureKey, "utf8");
  if (hashBuf.length !== sigBuf.length || !crypto.timingSafeEqual(hashBuf, sigBuf)) {
    throw new InvalidSignatureError("Webhook signature verification failed");
  }

  return true;
}

/**
 * Map Midtrans transaction status to internal TransactionStatus
 */
export function mapMidtransStatus(midtransStatus: string, fraudStatus?: string): TransactionStatus {
  // Handle fraud status first
  if (fraudStatus === "challenge") return TRANSACTION_STATUS.PROCESSING;
  if (fraudStatus === "deny") return TRANSACTION_STATUS.FAILED;

  // Map transaction status
  const statusMap: Record<string, TransactionStatus> = {
    capture: TRANSACTION_STATUS.COMPLETED,
    settlement: TRANSACTION_STATUS.COMPLETED,
    pending: TRANSACTION_STATUS.PENDING,
    deny: TRANSACTION_STATUS.FAILED,
    cancel: TRANSACTION_STATUS.CANCELLED,
    expire: TRANSACTION_STATUS.EXPIRED,
    refund: TRANSACTION_STATUS.REFUNDED,
    partial_refund: TRANSACTION_STATUS.REFUNDED,
  };

  return statusMap[midtransStatus.toLowerCase()] ?? TRANSACTION_STATUS.PENDING;
}
