// Midtrans Snap API Types

export interface SnapTransactionParams {
  transactionId: string;
  amount: number;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  productId: string;
  productName: string;
  finishCallbackUrl?: string | null;
}

export interface SnapTokenResponse {
  token: string;
  redirect_url: string;
}

export interface MidtransCustomerDetails {
  first_name: string;
  email: string;
  phone?: string;
}

export interface MidtransItemDetail {
  id: string;
  price: number;
  quantity: number;
  name: string;
}

export interface MidtransTransactionDetails {
  order_id: string;
  gross_amount: number;
}

export interface MidtransSnapRequest {
  transaction_details: MidtransTransactionDetails;
  customer_details: MidtransCustomerDetails;
  item_details: MidtransItemDetail[];
  callbacks?: {
    finish?: string;
  };
}

export interface MidtransNotification {
  transaction_time: string;
  transaction_status: string;
  transaction_id: string;
  status_message: string;
  status_code: string;
  signature_key: string;
  settlement_time?: string;
  payment_type: string;
  order_id: string;
  merchant_id: string;
  gross_amount: string;
  fraud_status?: string;
  currency?: string;
}

export interface TransactionStatusResponse {
  status_code: string;
  status_message: string;
  transaction_id: string;
  order_id: string;
  gross_amount: string;
  payment_type: string;
  transaction_time: string;
  transaction_status: string;
  fraud_status?: string;
  settlement_time?: string;
  currency?: string;
}

export type MidtransTransactionStatus =
  | "capture"
  | "settlement"
  | "pending"
  | "deny"
  | "cancel"
  | "expire"
  | "refund"
  | "partial_refund";

export interface VerifySignatureParams {
  orderId: string;
  statusCode: string;
  grossAmount: string;
  signatureKey: string;
}

// Transaction metadata types
export interface TransactionMetadata {
  snapToken?: string;
  snapTokenCreatedAt?: string;
  midtransNotification?: MidtransNotification;
  lastWebhookAt?: string;
  pricingSnapshot?: {
    listPrice?: number;
    productDiscountAmount?: number;
    promoDiscountAmount?: number;
    promoCode?: string | null;
  };
}

export interface SnapTokenMetadata {
  snapToken: string;
  snapTokenCreatedAt: string;
}
