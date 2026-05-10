import { formatPrice } from "@/lib/utils";

interface ProductCardStatsProps {
  data: {
    price: number;
    validDays: number;
  };
  compact?: boolean;
}

function validityLabel(validDays: number) {
  const unit = validDays === 1 ? "day" : "days";
  return `${validDays} ${unit} validity`;
}

export function ProductCardStats({ data, compact = false }: ProductCardStatsProps) {
  const text = compact ? "text-xs" : "text-sm";

  return (
    <div className={`text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 ${text}`}>
      <span className="text-foreground font-semibold tabular-nums">{formatPrice(data.price)}</span>
      <span>{validityLabel(data.validDays)}</span>
    </div>
  );
}
