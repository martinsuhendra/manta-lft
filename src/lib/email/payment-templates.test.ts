import { describe, expect, it } from "vitest";

import { createPaymentSuccessTemplate } from "@/lib/email/payment-templates";

describe("createPaymentSuccessTemplate", () => {
  it("renders react-email html with payment details", async () => {
    const template = await createPaymentSuccessTemplate({
      userName: "Alex",
      productName: "Monthly Unlimited",
      accountUrl: "https://example.com/public/my-account",
      amount: 1_850_000,
      currency: "IDR",
      transactionId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      paidAt: "2026-07-01T09:12:00.000Z",
      paymentMethod: "bank_transfer",
    });

    expect(template.subject).toBe("Payment Successful - Membership Activated");
    expect(template.html).toContain("Monthly Unlimited");
    expect(template.html).toContain("https://example.com/public/my-account");
    expect(template.html).toContain("Payment received");
    expect(template.html).toContain("manta-logo_e08ti8.jpg");
    expect(template.html).toContain("INV-A1B2C3D4");
    expect(template.html).toContain("PAID");
    expect(template.text).toContain("Alex");
    expect(template.text).toContain("Monthly Unlimited");
  });
});
