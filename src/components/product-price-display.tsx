import { cn, formatPrice } from "@/lib/utils";

interface ProductPriceDisplayProps {
  listPrice: number;
  finalPrice: number;
  isOnSale?: boolean;
  discountLabel?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: { sale: "text-lg", list: "text-sm" },
  md: { sale: "text-2xl", list: "text-base" },
  lg: { sale: "text-3xl", list: "text-lg" },
} as const;

type PriceSize = keyof typeof sizeClasses;

function getSizeClasses(size: PriceSize) {
  if (size === "sm") return sizeClasses.sm;
  if (size === "lg") return sizeClasses.lg;
  return sizeClasses.md;
}

export function ProductPriceDisplay({
  listPrice,
  finalPrice,
  isOnSale = false,
  discountLabel,
  size = "md",
  className,
}: ProductPriceDisplayProps) {
  const sizes = getSizeClasses(size);
  const onSale = Boolean(isOnSale);

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {onSale ? (
        <div className="flex flex-col items-start gap-0.5 leading-tight">
          <div className="flex items-baseline gap-2">
            <span className={cn("text-muted-foreground/80 font-medium tabular-nums line-through", sizes.list)}>
              {formatPrice(listPrice)}
            </span>
            {discountLabel ? (
              <span className="shrink-0 rounded-full bg-green-500/15 px-2 py-0.5 text-[11px] font-bold tracking-wide text-green-600 uppercase dark:text-green-400">
                {discountLabel}
              </span>
            ) : null}
          </div>
          <span className={cn("text-primary font-black tracking-tight tabular-nums", sizes.sale)}>
            {formatPrice(finalPrice)}
          </span>
        </div>
      ) : (
        // Keep the same hierarchy to reduce hydration mismatch risk.
        <div className="flex items-baseline gap-2">
          <span className={cn("text-primary font-black tracking-tight tabular-nums", sizes.sale)}>
            {formatPrice(listPrice)}
          </span>
        </div>
      )}
    </div>
  );
}

export function TransactionDiscountSummary({
  listPrice,
  amount,
  productDiscountAmount,
  promoDiscountAmount,
  promoCode,
  className,
}: {
  listPrice?: number | null;
  amount: number;
  productDiscountAmount?: number | null;
  promoDiscountAmount?: number | null;
  promoCode?: string | null;
  className?: string;
}) {
  const productDiscount = Number(productDiscountAmount ?? 0);
  const promoDiscount = Number(promoDiscountAmount ?? 0);
  const hasDiscount = productDiscount + promoDiscount > 0;
  const resolvedList = listPrice != null ? Number(listPrice) : amount + productDiscount + promoDiscount;

  if (!hasDiscount) {
    return <div className={cn("font-semibold tabular-nums", className)}>{formatPrice(amount)}</div>;
  }

  return (
    <div className={cn("space-y-1 text-sm", className)}>
      <div className="text-muted-foreground flex justify-between gap-4">
        <span>List price</span>
        <span className="tabular-nums line-through">{formatPrice(resolvedList)}</span>
      </div>
      {productDiscount > 0 ? (
        <div className="flex justify-between gap-4 text-green-700 dark:text-green-400">
          <span>Product discount</span>
          <span className="tabular-nums">-{formatPrice(productDiscount)}</span>
        </div>
      ) : null}
      {promoDiscount > 0 ? (
        <div className="flex justify-between gap-4 text-green-700 dark:text-green-400">
          <span>Promo{promoCode ? ` (${promoCode})` : ""}</span>
          <span className="tabular-nums">-{formatPrice(promoDiscount)}</span>
        </div>
      ) : null}
      <div className="flex justify-between gap-4 font-semibold">
        <span>Paid</span>
        <span className="tabular-nums">{formatPrice(amount)}</span>
      </div>
    </div>
  );
}
