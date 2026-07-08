import { describe, expect, it } from "vitest";

import { normalizePromoCode, resolveCheckoutPricing, resolveProductPricing } from "./checkout-pricing";

const now = new Date("2026-07-08T12:00:00.000Z");

describe("resolveProductPricing", () => {
  it("returns list price when no sale configured", () => {
    const result = resolveProductPricing({ price: 1_000_000 }, now);
    expect(result).toMatchObject({
      listPrice: 1_000_000,
      priceAfterProduct: 1_000_000,
      isOnSale: false,
      productDiscountAmount: 0,
    });
  });

  it("applies active sale price", () => {
    const result = resolveProductPricing(
      {
        price: 1_000_000,
        salePrice: 800_000,
        discountStartsAt: "2026-07-01T00:00:00.000Z",
        discountEndsAt: "2026-07-31T23:59:59.000Z",
      },
      now,
    );
    expect(result).toMatchObject({
      listPrice: 1_000_000,
      salePrice: 800_000,
      priceAfterProduct: 800_000,
      productDiscountAmount: 200_000,
      isOnSale: true,
      discountPercent: 20,
    });
  });

  it("ignores sale outside schedule", () => {
    const result = resolveProductPricing(
      {
        price: 1_000_000,
        salePrice: 800_000,
        discountEndsAt: "2026-07-01T00:00:00.000Z",
      },
      now,
    );
    expect(result.isOnSale).toBe(false);
    expect(result.priceAfterProduct).toBe(1_000_000);
  });
});

describe("resolveCheckoutPricing", () => {
  const product = {
    price: 1_000_000,
    salePrice: 800_000,
    discountStartsAt: "2026-07-01T00:00:00.000Z",
    discountEndsAt: "2026-07-31T23:59:59.000Z",
  };

  const promo = {
    id: "promo-1",
    code: "save10",
    brandId: "brand-1",
    discountType: "PERCENT" as const,
    discountValue: 10,
    maxDiscountAmount: null,
    startsAt: null,
    endsAt: null,
    usageLimit: 100,
    usageCount: 0,
    perUserLimit: 1,
    applicableProductIds: [],
    isActive: true,
  };

  it("stacks promo on product sale price", () => {
    const result = resolveCheckoutPricing({
      product,
      productId: "prod-1",
      brandId: "brand-1",
      promo,
      promoCode: "SAVE10",
      now,
    });
    expect(result.priceAfterProduct).toBe(800_000);
    expect(result.promoDiscountAmount).toBe(80_000);
    expect(result.finalAmount).toBe(720_000);
    expect(result.promoCode).toBe("SAVE10");
  });

  it("rejects invalid promo", () => {
    expect(() =>
      resolveCheckoutPricing({
        product,
        productId: "prod-1",
        brandId: "brand-1",
        promo: { ...promo, isActive: false },
        promoCode: "SAVE10",
        now,
      }),
    ).toThrow("This promo code is not active");
  });
});

describe("validatePromoCode", () => {
  it("normalizes promo codes", () => {
    expect(normalizePromoCode(" save20 ")).toBe("SAVE20");
  });
});
