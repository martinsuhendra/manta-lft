import type { PromoCode, PromoDiscountType, Product } from "@prisma/client";

export interface ProductPricingInput {
  price: number | string;
  salePrice?: number | string | null;
  discountStartsAt?: Date | string | null;
  discountEndsAt?: Date | string | null;
}

export interface PromoCodePricingInput {
  id: string;
  code: string;
  brandId: string;
  discountType: PromoDiscountType;
  discountValue: number | string;
  maxDiscountAmount?: number | string | null;
  startsAt?: Date | string | null;
  endsAt?: Date | string | null;
  usageLimit?: number | null;
  usageCount: number;
  perUserLimit: number;
  applicableProductIds: string[];
  isActive: boolean;
}

export interface ProductPricingResult {
  listPrice: number;
  salePrice: number | null;
  priceAfterProduct: number;
  productDiscountAmount: number;
  isOnSale: boolean;
  discountPercent: number | null;
  discountLabel: string | null;
}

export interface CheckoutPricingResult extends ProductPricingResult {
  promoDiscountAmount: number;
  finalAmount: number;
  totalDiscountAmount: number;
  promoCode: string | null;
  promoCodeId: string | null;
}

export interface ResolveCheckoutPricingParams {
  product: ProductPricingInput;
  productId: string;
  brandId: string;
  promo?: PromoCodePricingInput | null;
  promoCode?: string | null;
  userPromoRedemptionCount?: number;
  now?: Date;
}

/** Round IDR to whole rupiah. */
export function roundIdr(amount: number): number {
  return Math.max(0, Math.round(amount));
}

export function toNumber(value: number | string | { toString(): string } | null | undefined): number {
  if (value == null) return 0;
  return Number(value);
}

export function normalizePromoCode(code: string): string {
  return code.trim().toUpperCase();
}

function isWithinWindow(now: Date, startsAt?: Date | string | null, endsAt?: Date | string | null): boolean {
  if (startsAt && now < new Date(startsAt)) return false;
  if (endsAt && now > new Date(endsAt)) return false;
  return true;
}

export function isProductSaleActive(product: ProductPricingInput, now = new Date()): boolean {
  const listPrice = roundIdr(toNumber(product.price));
  const salePrice = product.salePrice != null ? roundIdr(toNumber(product.salePrice)) : null;
  if (salePrice == null || salePrice >= listPrice) return false;
  return isWithinWindow(now, product.discountStartsAt, product.discountEndsAt);
}

export function resolveProductPricing(product: ProductPricingInput, now = new Date()): ProductPricingResult {
  const listPrice = roundIdr(toNumber(product.price));
  const rawSale = product.salePrice != null ? roundIdr(toNumber(product.salePrice)) : null;
  const isOnSale = isProductSaleActive(product, now);
  const salePrice = isOnSale && rawSale != null ? rawSale : null;
  const priceAfterProduct = salePrice ?? listPrice;
  const productDiscountAmount = roundIdr(listPrice - priceAfterProduct);

  let discountPercent: number | null = null;
  let discountLabel: string | null = null;
  if (isOnSale && productDiscountAmount > 0) {
    discountPercent = listPrice > 0 ? Math.round((productDiscountAmount / listPrice) * 100) : null;
    discountLabel =
      discountPercent != null && discountPercent > 0 ? `${discountPercent}% OFF` : `Save Rp ${productDiscountAmount}`;
  }

  return {
    listPrice,
    salePrice,
    priceAfterProduct,
    productDiscountAmount,
    isOnSale,
    discountPercent,
    discountLabel,
  };
}

function calculatePromoDiscount(priceAfterProduct: number, promo: PromoCodePricingInput): number {
  const base = roundIdr(priceAfterProduct);
  if (base <= 0) return 0;

  let discount = 0;
  if (promo.discountType === "PERCENT") {
    const percent = toNumber(promo.discountValue);
    discount = roundIdr((base * percent) / 100);
    const maxCap = promo.maxDiscountAmount != null ? roundIdr(toNumber(promo.maxDiscountAmount)) : null;
    if (maxCap != null) discount = Math.min(discount, maxCap);
  } else {
    discount = roundIdr(toNumber(promo.discountValue));
  }

  return Math.min(discount, base);
}

export function validatePromoCode(params: {
  promo: PromoCodePricingInput;
  productId: string;
  brandId: string;
  userPromoRedemptionCount?: number;
  now?: Date;
}): { valid: true } | { valid: false; reason: string } {
  const { promo, productId, brandId, userPromoRedemptionCount = 0, now = new Date() } = params;

  if (!promo.isActive) return { valid: false, reason: "This promo code is not active" };
  if (promo.brandId !== brandId) return { valid: false, reason: "This promo code is not valid for this brand" };
  if (!isWithinWindow(now, promo.startsAt, promo.endsAt)) {
    return { valid: false, reason: "This promo code has expired or is not yet active" };
  }
  if (promo.usageLimit != null && promo.usageCount >= promo.usageLimit) {
    return { valid: false, reason: "This promo code has reached its usage limit" };
  }
  if (userPromoRedemptionCount >= promo.perUserLimit) {
    return { valid: false, reason: "You have already used this promo code" };
  }
  if (promo.applicableProductIds.length > 0 && !promo.applicableProductIds.includes(productId)) {
    return { valid: false, reason: "This promo code does not apply to this product" };
  }

  return { valid: true };
}

export function resolveCheckoutPricing(params: ResolveCheckoutPricingParams): CheckoutPricingResult {
  const now = params.now ?? new Date();
  const productPricing = resolveProductPricing(params.product, now);

  let promoDiscountAmount = 0;
  let promoCode: string | null = null;
  let promoCodeId: string | null = null;

  if (params.promo && params.promoCode) {
    const validation = validatePromoCode({
      promo: params.promo,
      productId: params.productId,
      brandId: params.brandId,
      userPromoRedemptionCount: params.userPromoRedemptionCount,
      now,
    });
    if (!validation.valid) {
      throw new Error(validation.reason);
    }
    promoDiscountAmount = calculatePromoDiscount(productPricing.priceAfterProduct, params.promo);
    promoCode = normalizePromoCode(params.promo.code);
    promoCodeId = params.promo.id;
  }

  const finalAmount = roundIdr(productPricing.priceAfterProduct - promoDiscountAmount);

  return {
    ...productPricing,
    promoDiscountAmount,
    finalAmount,
    totalDiscountAmount: roundIdr(productPricing.productDiscountAmount + promoDiscountAmount),
    promoCode,
    promoCodeId,
  };
}

export function toProductPricingInput(
  product: Pick<Product, "price" | "salePrice" | "discountStartsAt" | "discountEndsAt">,
): ProductPricingInput {
  return {
    price: toNumber(product.price),
    salePrice: product.salePrice != null ? toNumber(product.salePrice) : null,
    discountStartsAt: product.discountStartsAt,
    discountEndsAt: product.discountEndsAt,
  };
}

export function toPromoCodePricingInput(promo: PromoCode): PromoCodePricingInput {
  return {
    id: promo.id,
    code: promo.code,
    brandId: promo.brandId,
    discountType: promo.discountType,
    discountValue: toNumber(promo.discountValue),
    maxDiscountAmount: promo.maxDiscountAmount != null ? toNumber(promo.maxDiscountAmount) : null,
    startsAt: promo.startsAt,
    endsAt: promo.endsAt,
    usageLimit: promo.usageLimit,
    usageCount: promo.usageCount,
    perUserLimit: promo.perUserLimit,
    applicableProductIds: promo.applicableProductIds,
    isActive: promo.isActive,
  };
}

export function appendProductPricingFields<T extends ProductPricingInput>(
  product: T,
  now = new Date(),
): T & {
  finalPrice: number;
  isOnSale: boolean;
  discountPercent: number | null;
  discountLabel: string | null;
  productDiscountAmount: number;
} {
  const pricing = resolveProductPricing(product, now);
  return {
    ...product,
    finalPrice: pricing.priceAfterProduct,
    isOnSale: pricing.isOnSale,
    discountPercent: pricing.discountPercent,
    discountLabel: pricing.discountLabel,
    productDiscountAmount: pricing.productDiscountAmount,
  };
}
