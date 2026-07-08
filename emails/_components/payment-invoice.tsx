import { Column, Hr, Row, Section, Text } from "@react-email/components";

import { brandColors } from "@/lib/email/base";

import { formatEmailAmount, formatEmailDate, formatInvoiceNumber, formatPaymentMethod } from "./invoice-utils";
import {
  emailInvoiceBodyStyle,
  emailInvoiceContainerStyle,
  emailInvoiceDividerStyle,
  emailInvoiceLabelStyle,
  emailInvoiceMutedStyle,
  emailInvoiceTableHeaderStyle,
  emailInvoiceTotalLabelStyle,
  emailInvoiceTotalValueStyle,
  emailInvoiceValueStyle,
  emailPaidBadgeStyle,
  emailSuccessBannerStyle,
} from "./styles";

export interface PaymentInvoiceProps {
  userName?: string;
  productName: string;
  amount?: number;
  currency?: string;
  transactionId?: string;
  paidAt?: string | Date | null;
  paymentMethod?: string | null;
  listPrice?: number | null;
  productDiscountAmount?: number | null;
  promoDiscountAmount?: number | null;
  promoCode?: string | null;
}

export function PaymentInvoice({
  userName,
  productName,
  amount,
  currency = "IDR",
  transactionId,
  paidAt,
  paymentMethod,
  listPrice,
  productDiscountAmount,
  promoDiscountAmount,
  promoCode,
}: PaymentInvoiceProps) {
  const invoiceNumber = transactionId ? formatInvoiceNumber(transactionId) : "INV-PREVIEW";
  const paidOn = formatEmailDate(paidAt);
  const total = formatEmailAmount(amount, currency);
  const method = formatPaymentMethod(paymentMethod);
  const productDiscount = Number(productDiscountAmount ?? 0);
  const promoDiscount = Number(promoDiscountAmount ?? 0);
  const subtotal = listPrice != null ? formatEmailAmount(listPrice, currency) : total;

  return (
    <Section style={emailInvoiceContainerStyle}>
      <Section style={emailInvoiceBodyStyle}>
        <Row>
          <Column style={{ verticalAlign: "top", width: "62%" }}>
            <Text style={emailInvoiceLabelStyle}>Receipt</Text>
            <Text style={{ ...emailInvoiceValueStyle, fontSize: 17, lineHeight: "24px", marginTop: 4 }}>
              {invoiceNumber}
            </Text>
            <Text style={{ ...emailInvoiceMutedStyle, marginTop: 8, fontSize: 12 }}>{paidOn}</Text>
          </Column>
          <Column align="right" style={{ verticalAlign: "top", width: "38%" }}>
            <Text style={emailPaidBadgeStyle}>PAID</Text>
          </Column>
        </Row>

        <Hr style={emailInvoiceDividerStyle} />

        <Row>
          <Column style={{ width: "50%" }}>
            <Text style={emailInvoiceLabelStyle}>Billed to</Text>
            <Text style={emailInvoiceValueStyle}>{userName ?? "Member"}</Text>
          </Column>
          <Column align="right" style={{ width: "50%" }}>
            <Text style={emailInvoiceLabelStyle}>Payment</Text>
            <Text style={{ ...emailInvoiceValueStyle, textAlign: "right" as const }}>{method}</Text>
          </Column>
        </Row>

        <Section
          style={{
            marginTop: 18,
            border: `1px solid ${brandColors.border}`,
            borderRadius: 8,
            overflow: "hidden",
          }}
        >
          <Row
            style={{
              backgroundColor: brandColors.accent,
              padding: "10px 14px",
            }}
          >
            <Column style={{ width: "58%" }}>
              <Text style={emailInvoiceTableHeaderStyle}>Item</Text>
            </Column>
            <Column align="center" style={{ width: "12%" }}>
              <Text style={emailInvoiceTableHeaderStyle}>Qty</Text>
            </Column>
            <Column align="right" style={{ width: "30%" }}>
              <Text style={emailInvoiceTableHeaderStyle}>Amount</Text>
            </Column>
          </Row>

          <Row style={{ padding: "12px 14px" }}>
            <Column style={{ width: "58%" }}>
              <Text style={{ ...emailInvoiceValueStyle, margin: 0 }}>{productName}</Text>
            </Column>
            <Column align="center" style={{ width: "12%" }}>
              <Text style={{ ...emailInvoiceValueStyle, margin: 0 }}>1</Text>
            </Column>
            <Column align="right" style={{ width: "30%" }}>
              <Text style={{ ...emailInvoiceValueStyle, margin: 0 }}>{subtotal}</Text>
            </Column>
          </Row>
          {productDiscount > 0 ? (
            <Row style={{ padding: "8px 14px" }}>
              <Column style={{ width: "70%" }}>
                <Text style={{ ...emailInvoiceMutedStyle, margin: 0 }}>Product discount</Text>
              </Column>
              <Column align="right" style={{ width: "30%" }}>
                <Text style={{ ...emailInvoiceMutedStyle, margin: 0 }}>
                  -{formatEmailAmount(productDiscount, currency)}
                </Text>
              </Column>
            </Row>
          ) : null}
          {promoDiscount > 0 ? (
            <Row style={{ padding: "8px 14px" }}>
              <Column style={{ width: "70%" }}>
                <Text style={{ ...emailInvoiceMutedStyle, margin: 0 }}>Promo{promoCode ? ` (${promoCode})` : ""}</Text>
              </Column>
              <Column align="right" style={{ width: "30%" }}>
                <Text style={{ ...emailInvoiceMutedStyle, margin: 0 }}>
                  -{formatEmailAmount(promoDiscount, currency)}
                </Text>
              </Column>
            </Row>
          ) : null}
        </Section>

        <Hr style={emailInvoiceDividerStyle} />

        <Row>
          <Column>
            <Text style={emailInvoiceTotalLabelStyle}>Total</Text>
          </Column>
          <Column align="right">
            <Text style={emailInvoiceTotalValueStyle}>{total}</Text>
          </Column>
        </Row>

        <Text style={{ ...emailSuccessBannerStyle, textAlign: "center" as const }}>
          Membership activated — you&apos;re good to go.
        </Text>
      </Section>
    </Section>
  );
}
