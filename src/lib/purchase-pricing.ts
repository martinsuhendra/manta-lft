import type { Prisma, Product, PromoCode } from "@prisma/client";

import {
  normalizePromoCode,
  resolveCheckoutPricing,
  toProductPricingInput,
  toPromoCodePricingInput,
  type CheckoutPricingResult,
} from "@/lib/checkout-pricing";
import { prisma } from "@/lib/generated/prisma";

export async function findPromoCodeForCheckout(params: { code: string; brandId: string }): Promise<PromoCode | null> {
  const normalized = normalizePromoCode(params.code);
  if (!normalized) return null;

  return prisma.promoCode.findFirst({
    where: {
      brandId: params.brandId,
      code: normalized,
    },
  });
}

export async function countUserPromoRedemptions(promoCodeId: string, userId: string): Promise<number> {
  return prisma.promoCodeRedemption.count({
    where: { promoCodeId, userId },
  });
}

export async function resolvePurchasePricing(params: {
  product: Product;
  productId: string;
  brandId: string;
  userId: string;
  promoCode?: string | null;
  now?: Date;
}): Promise<CheckoutPricingResult> {
  const promo =
    params.promoCode != null && params.promoCode.trim() !== ""
      ? await findPromoCodeForCheckout({ code: params.promoCode, brandId: params.brandId })
      : null;

  if (params.promoCode && !promo) {
    throw new Error("Invalid promo code");
  }

  const userPromoRedemptionCount = promo ? await countUserPromoRedemptions(promo.id, params.userId) : 0;

  return resolveCheckoutPricing({
    product: toProductPricingInput(params.product),
    productId: params.productId,
    brandId: params.brandId,
    promo: promo ? toPromoCodePricingInput(promo) : null,
    promoCode: promo?.code ?? null,
    userPromoRedemptionCount,
    now: params.now,
  });
}

export function buildTransactionPricingData(pricing: CheckoutPricingResult): Pick<
  Prisma.TransactionCreateInput,
  "amount" | "listPrice" | "productDiscountAmount" | "promoDiscountAmount" | "promoCode"
> & {
  promoCodeId?: string | null;
} {
  return {
    amount: pricing.finalAmount,
    listPrice: pricing.listPrice,
    productDiscountAmount: pricing.productDiscountAmount,
    promoDiscountAmount: pricing.promoDiscountAmount,
    promoCode: pricing.promoCode,
    promoCodeId: pricing.promoCodeId,
  };
}

export async function recordPromoRedemption(params: {
  tx: Prisma.TransactionClient;
  promoCodeId: string;
  userId: string;
  transactionId: string;
  discountAmount: number;
}) {
  await params.tx.promoCode.update({
    where: { id: params.promoCodeId },
    data: { usageCount: { increment: 1 } },
  });

  await params.tx.promoCodeRedemption.create({
    data: {
      promoCodeId: params.promoCodeId,
      userId: params.userId,
      transactionId: params.transactionId,
      discountAmount: params.discountAmount,
    },
  });
}
