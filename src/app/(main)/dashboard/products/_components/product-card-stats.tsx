import { ProductPriceDisplay } from "@/components/product-price-display";
import { resolveProductPricing } from "@/lib/checkout-pricing";

interface ProductCardStatsProps {
  data: {
    price: number;
    salePrice?: number | null;
    discountStartsAt?: string | Date | null;
    discountEndsAt?: string | Date | null;
    finalPrice?: number;
    isOnSale?: boolean;
    discountLabel?: string | null;
    validDays: number;
  };
  compact?: boolean;
  /** Form preview: show configured sale even if schedule hasn't started */
  previewSale?: boolean;
  /** Admin grid: show configured salePrice from DB regardless of schedule window */
  showConfiguredSale?: boolean;
}

function validityLabel(validDays: number) {
  const unit = validDays === 1 ? "day" : "days";
  return `${validDays} ${unit} validity`;
}

function resolveDisplayPricing(
  data: ProductCardStatsProps["data"],
  options: { previewSale?: boolean; showConfiguredSale?: boolean },
) {
  const configuredSale =
    data.salePrice != null && data.salePrice < data.price && (options.previewSale || options.showConfiguredSale);

  if (configuredSale) {
    return resolveProductPricing({ price: data.price, salePrice: data.salePrice });
  }

  return resolveProductPricing({
    price: data.price,
    salePrice: data.salePrice,
    discountStartsAt: data.discountStartsAt,
    discountEndsAt: data.discountEndsAt,
  });
}

export function ProductCardStats({
  data,
  compact = false,
  previewSale = false,
  showConfiguredSale = false,
}: ProductCardStatsProps) {
  const text = compact ? "text-xs" : "text-sm";
  const pricing = resolveDisplayPricing(data, { previewSale, showConfiguredSale });
  const finalPrice = pricing.isOnSale ? pricing.priceAfterProduct : (data.finalPrice ?? pricing.priceAfterProduct);
  const isOnSale = pricing.isOnSale;
  const discountLabel = data.discountLabel ?? pricing.discountLabel;

  return (
    <div className={`flex w-full flex-wrap items-center justify-between gap-x-3 gap-y-1 ${text}`}>
      <ProductPriceDisplay
        listPrice={data.price}
        finalPrice={finalPrice}
        isOnSale={isOnSale}
        discountLabel={discountLabel}
        size={compact ? "sm" : "md"}
      />
      <span className="text-muted-foreground whitespace-nowrap">{validityLabel(data.validDays)}</span>
    </div>
  );
}
