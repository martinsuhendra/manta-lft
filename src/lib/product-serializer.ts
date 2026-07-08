import { appendProductPricingFields, toNumber } from "@/lib/checkout-pricing";
import { parseCloudinaryAsset, resolveAssetUrl } from "@/lib/cloudinary-asset";

interface ProductWithBrands {
  id: string;
  name: string;
  description: string | null;
  price: unknown;
  salePrice?: unknown;
  discountStartsAt?: Date | string | null;
  discountEndsAt?: Date | string | null;
  validDays: number;
  isPurchaseUnlimited: boolean;
  purchaseLimitPerUser: number | null;
  isActive: boolean;
  isPublic: boolean;
  features: string[];
  image: string | null;
  imageAsset?: unknown;
  paymentUrl: string | null;
  whatIsIncluded: string | null;
  participantsPerPurchase: number;
  position: number;
  createdAt: Date | string;
  updatedAt: Date | string;
  productBrands?: Array<{ brandId: string; brand: { id: string; name: string } }>;
  _count?: {
    memberships: number;
    transactions: number;
    productItems?: number;
    quotaPools?: number;
  };
}

export function serializeAdminProduct<T extends ProductWithBrands>(product: T, now = new Date()) {
  const pricingInput = {
    price: toNumber(product.price as number | string),
    salePrice: product.salePrice != null ? toNumber(product.salePrice as number | string) : null,
    discountStartsAt: product.discountStartsAt,
    discountEndsAt: product.discountEndsAt,
  };
  const withPricing = appendProductPricingFields(pricingInput, now);

  return {
    ...product,
    price: withPricing.price,
    salePrice: pricingInput.salePrice,
    discountStartsAt: product.discountStartsAt,
    discountEndsAt: product.discountEndsAt,
    brandIds: product.productBrands?.map((pb) => pb.brandId) ?? [],
    brands: product.productBrands?.map((pb) => pb.brand) ?? [],
    imageAsset: parseCloudinaryAsset(product.imageAsset),
    image: resolveAssetUrl(product.imageAsset, product.image),
    finalPrice: withPricing.finalPrice,
    isOnSale: withPricing.isOnSale,
    discountPercent: withPricing.discountPercent,
    discountLabel: withPricing.discountLabel,
    productDiscountAmount: withPricing.productDiscountAmount,
  };
}

export function serializePublicProduct<T extends ProductWithBrands>(product: T, now = new Date()) {
  const serialized = serializeAdminProduct(product, now);
  return {
    id: serialized.id,
    name: serialized.name,
    description: serialized.description,
    price: serialized.price,
    salePrice: serialized.salePrice,
    finalPrice: serialized.finalPrice,
    isOnSale: serialized.isOnSale,
    discountPercent: serialized.discountPercent,
    discountLabel: serialized.discountLabel,
    productDiscountAmount: serialized.productDiscountAmount,
    validDays: serialized.validDays,
    image: serialized.image,
    paymentUrl: serialized.paymentUrl,
    whatIsIncluded: serialized.whatIsIncluded,
    features: serialized.features,
    createdAt: serialized.createdAt instanceof Date ? serialized.createdAt.toISOString() : String(serialized.createdAt),
  };
}
