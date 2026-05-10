"use client";

import * as React from "react";

import { Edit2, MoreVertical } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StatusBadge } from "@/components/ui/status-badge";
import { cn } from "@/lib/utils";

import { ProductCardImage } from "./product-card-image";
import { ProductCardIncludes } from "./product-card-includes";
import { ProductCardStats } from "./product-card-stats";
import { Product } from "./schema";

type ProductData = Pick<
  Product,
  "name" | "description" | "price" | "validDays" | "image" | "paymentUrl" | "whatIsIncluded" | "isActive" | "createdAt"
> & {
  _count: { memberships: number };
};

function ProductCardActions({
  product,
  onViewProduct,
  onEditProduct,
  onDeleteProduct,
}: {
  product: Product;
  onViewProduct?: (product: Product) => void;
  onEditProduct?: (product: Product) => void;
  onDeleteProduct?: (product: Product) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
        >
          <MoreVertical className="h-4 w-4" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem onClick={() => onViewProduct?.(product)}>View Details</DropdownMenuItem>
        <DropdownMenuItem onClick={() => onEditProduct?.(product)}>Edit Product</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={() => onDeleteProduct?.(product)}>
          Delete Product
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ProductCardHeader({
  data,
  compact,
  isPreview,
  product,
  onViewProduct,
  onEditProduct,
  onDeleteProduct,
}: {
  data: ProductData;
  compact: boolean;
  isPreview: boolean;
  product?: Product | null;
  onViewProduct?: (product: Product) => void;
  onEditProduct?: (product: Product) => void;
  onDeleteProduct?: (product: Product) => void;
}) {
  if (compact) {
    return (
      <CardHeader className="space-y-0 p-4 pt-4 pb-2">
        <ProductCardImage data={data} variant="compact" />
        <div className="mt-3 min-w-0 space-y-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-foreground line-clamp-2 text-base leading-snug font-semibold break-words">
              {data.name}
            </h3>
            {product ? (
              <ProductCardActions
                product={product}
                onViewProduct={onViewProduct}
                onEditProduct={onEditProduct}
                onDeleteProduct={onDeleteProduct}
              />
            ) : null}
          </div>
          {data.description ? (
            <p className="text-muted-foreground line-clamp-2 text-xs leading-relaxed">{data.description}</p>
          ) : null}
        </div>
      </CardHeader>
    );
  }

  return (
    <CardHeader className="pb-3">
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="text-lg leading-relaxed font-semibold break-words">{data.name}</h3>
          {data.description ? (
            <p className="text-muted-foreground mt-2 line-clamp-2 text-sm">{data.description}</p>
          ) : null}
        </div>
        {!isPreview && product ? (
          <ProductCardActions
            product={product}
            onViewProduct={onViewProduct}
            onEditProduct={onEditProduct}
            onDeleteProduct={onDeleteProduct}
          />
        ) : null}
      </div>
    </CardHeader>
  );
}
function ProductCardFeatures({ product, compact }: { product?: Product | null; compact?: boolean }) {
  if (!product?.features || product.features.length === 0) return null;

  return (
    <div className={compact ? "mt-2" : "mt-3"}>
      <div className="flex flex-wrap gap-1">
        {product.features.slice(0, 3).map((feature) => (
          <StatusBadge key={feature} variant="outline" className={compact ? "px-1.5 py-0 text-[11px]" : "text-xs"}>
            {feature}
          </StatusBadge>
        ))}
        {product.features.length > 3 && (
          <StatusBadge variant="outline" className={compact ? "px-1.5 py-0 text-[11px]" : "text-xs"}>
            +{product.features.length - 3} more
          </StatusBadge>
        )}
      </div>
    </div>
  );
}
function ProductCardFooter({
  data,
  compact,
  product,
  onEditProduct,
}: {
  data: ProductData;
  compact?: boolean;
  product?: Product | null;
  onEditProduct?: (product: Product) => void;
}) {
  return (
    <CardFooter
      className={
        compact ? "border-border/60 flex items-center justify-end gap-2 border-t px-4 py-2.5" : "flex justify-end pt-0"
      }
    >
      <StatusBadge
        variant={data.isActive ? "success" : "destructive"}
        className={compact ? "h-5 shrink-0 px-1.5 text-[11px]" : "shrink-0"}
      >
        {data.isActive ? "Active" : "Inactive"}
      </StatusBadge>
      {compact && product && onEditProduct ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="text-muted-foreground hover:text-foreground h-7 gap-1 px-2 text-xs"
          onClick={(event) => {
            event.stopPropagation();
            onEditProduct(product);
          }}
        >
          <Edit2 className="size-3.5" />
          Edit
        </Button>
      ) : null}
    </CardFooter>
  );
}
interface ProductCardProps {
  product?: Product;
  name?: string;
  description?: string;
  price?: number;
  validDays?: number;
  image?: string;
  paymentUrl?: string;
  whatIsIncluded?: string;
  isActive?: boolean;
  isPreview?: boolean;
  onViewProduct?: (product: Product) => void;
  onEditProduct?: (product: Product) => void;
  onDeleteProduct?: (product: Product) => void;
}
const DEFAULT_PRODUCT_DATA: ProductData = {
  name: "Product Name",
  description: null,
  price: 0,
  validDays: 30,
  image: null,
  paymentUrl: null,
  whatIsIncluded: null,
  isActive: true,
  createdAt: new Date().toISOString(),
  _count: { memberships: 0 },
};

function createProductData(props: ProductCardProps): ProductData {
  if (props.product) return props.product;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- intentionally omit from overrides
  const { product, isPreview, onViewProduct, onEditProduct, onDeleteProduct, ...overrides } = props;
  return { ...DEFAULT_PRODUCT_DATA, ...overrides } as ProductData;
}
export function ProductCard(props: ProductCardProps) {
  const { product, isPreview = false, onViewProduct, onEditProduct, onDeleteProduct } = props;
  const [isExpanded, setIsExpanded] = React.useState(false);
  const data = createProductData(props);
  const compact = !isPreview;

  return (
    <Card
      className={cn(
        "group from-card via-primary/[0.045] to-muted/30 dark:via-primary/[0.08] dark:to-muted/15 relative overflow-hidden bg-gradient-to-br transition-shadow hover:shadow-md",
        compact ? "gap-3 py-4" : "",
      )}
    >
      <ProductCardHeader
        data={data}
        compact={compact}
        isPreview={isPreview}
        product={product}
        onViewProduct={onViewProduct}
        onEditProduct={onEditProduct}
        onDeleteProduct={onDeleteProduct}
      />
      <CardContent className={compact ? "space-y-2 px-4 pt-0 pb-2" : "pb-3"}>
        {compact ? <ProductCardStats data={data} compact /> : null}
        {!compact ? <ProductCardImage data={data} /> : null}
        {!compact ? <ProductCardStats data={data} /> : null}
        <ProductCardIncludes data={data} isPreview={isPreview} isExpanded={isExpanded} setIsExpanded={setIsExpanded} />
        <ProductCardFeatures product={product} compact={compact} />
      </CardContent>
      <ProductCardFooter data={data} compact={compact} product={product} onEditProduct={onEditProduct} />
    </Card>
  );
}
export function ProductPreview({
  name,
  description,
  price,
  validDays,
  image,
  whatIsIncluded,
  isActive,
}: {
  name: string;
  description?: string;
  price: number;
  validDays: number;
  image?: string;
  whatIsIncluded?: string;
  isActive: boolean;
}) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium">Preview</h3>
      <ProductCard
        name={name}
        description={description}
        price={price}
        validDays={validDays}
        image={image}
        whatIsIncluded={whatIsIncluded}
        isActive={isActive}
        isPreview
      />
    </div>
  );
}
