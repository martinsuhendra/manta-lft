"use client";

import * as React from "react";

import { CalendarDays, CheckCircle2, Hash, Layers, Package, Sparkles, Users } from "lucide-react";

import { ProductPriceDisplay } from "@/components/product-price-display";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { resolveProductPricing } from "@/lib/checkout-pricing";

import { Item } from "../../admin/items/_components/schema";

import { FormData } from "./hooks/use-form-validation";
import { ProductPreview } from "./product-card";
import { Product, QuotaPool, CreateProductItemForm, QuotaType } from "./schema";

export interface ProductSuccessSummary {
  formData: FormData;
  productItems: CreateProductItemForm[];
  quotaPools: QuotaPool[];
  items: Item[];
  savedProduct: Product;
}

function quotaTypeLabel(type: QuotaType, quotaValue?: number, poolName?: string) {
  if (type === "INDIVIDUAL" && quotaValue != null) return `${quotaValue} uses / member`;
  if (type === "SHARED" && poolName) return `Shared · ${poolName}`;
  if (type === "FREE") return "Unlimited";
  return type;
}

function SuccessPriceDisplay({ formData }: { formData: FormData }) {
  const price = formData.price || 0;
  const pricing =
    formData.isOnSale && formData.salePrice != null
      ? resolveProductPricing({ price, salePrice: formData.salePrice })
      : resolveProductPricing({ price });

  return (
    <ProductPriceDisplay
      listPrice={price}
      finalPrice={pricing.priceAfterProduct}
      isOnSale={pricing.isOnSale}
      discountLabel={pricing.discountLabel}
      size="sm"
    />
  );
}

function ProductSuccessHero({ isEdit, savedProduct }: { isEdit: boolean; savedProduct: Product }) {
  return (
    <>
      <div
        className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-emerald-400/10 blur-3xl dark:bg-emerald-400/15"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-20 -left-20 h-56 w-56 rounded-full bg-violet-400/10 blur-3xl dark:bg-violet-400/12"
        aria-hidden
      />

      <DialogHeader className="relative space-y-3 px-6 pt-8 pb-2">
        <div className="flex flex-col items-center text-center sm:flex-row sm:items-start sm:gap-5 sm:text-left">
          <div className="relative flex h-16 w-16 flex-shrink-0 items-center justify-center">
            <div className="absolute inset-0 rounded-2xl bg-emerald-500/20 blur-md dark:bg-emerald-400/25" />
            <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/90 to-teal-600/90 shadow-lg ring-2 ring-emerald-400/30 dark:ring-emerald-300/25">
              <CheckCircle2 className="h-8 w-8 text-white drop-shadow-sm" strokeWidth={2} />
            </div>
          </div>
          <div className="min-w-0 flex-1 pt-1">
            <div className="text-muted-foreground mb-1 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <Badge variant="secondary" className="gap-1 font-normal">
                <Sparkles className="h-3 w-3" />
                {isEdit ? "Changes saved" : "New product live"}
              </Badge>
              {savedProduct.brands.map((brand) => (
                <Badge key={brand.id} variant="outline" className="font-normal">
                  {brand.name}
                </Badge>
              ))}
            </div>
            <DialogTitle className="text-2xl font-semibold tracking-tight sm:text-3xl">
              {isEdit ? "Product updated" : "Product created"}
            </DialogTitle>
            <DialogDescription className="text-base">
              {isEdit
                ? "Here’s a summary of what we saved. You can close this when you’re done."
                : "Here’s everything that was set up. You can close this when you’re ready."}
            </DialogDescription>
          </div>
        </div>
      </DialogHeader>
    </>
  );
}

function ProductSuccessSummaryPanel({
  formData,
  productItems,
  quotaPools,
  items,
  poolById,
  savedProduct,
}: {
  formData: FormData;
  productItems: CreateProductItemForm[];
  quotaPools: QuotaPool[];
  items: Item[];
  poolById: Map<string, QuotaPool>;
  savedProduct: Product;
}) {
  return (
    <div className="bg-card/80 border-border/60 dark:bg-card/60 space-y-5 rounded-2xl border p-5 shadow-sm backdrop-blur-sm">
      <div>
        <h3 className="text-foreground flex items-center gap-2 text-lg font-semibold">
          <Package className="text-primary h-5 w-5" />
          {formData.name || "Untitled product"}
        </h3>
        {formData.description ? (
          <p className="text-muted-foreground mt-2 line-clamp-3 text-sm leading-relaxed">{formData.description}</p>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="bg-muted/40 flex flex-col gap-0.5 rounded-xl border px-3 py-2.5">
          <span className="text-muted-foreground text-xs font-medium">Price</span>
          <SuccessPriceDisplay formData={formData} />
        </div>
        <div className="bg-muted/40 flex flex-col gap-0.5 rounded-xl border px-3 py-2.5">
          <span className="text-muted-foreground flex items-center gap-1 text-xs font-medium">
            <CalendarDays className="h-3 w-3" />
            Valid for
          </span>
          <span className="text-foreground text-base font-semibold tabular-nums">
            {formData.validDays} <span className="text-muted-foreground text-sm font-normal">days</span>
          </span>
        </div>
        <div className="bg-muted/40 col-span-2 flex flex-col gap-0.5 rounded-xl border px-3 py-2.5 sm:col-span-1">
          <span className="text-muted-foreground flex items-center gap-1 text-xs font-medium">
            <Users className="h-3 w-3" />
            Per purchase
          </span>
          <span className="text-foreground text-base font-semibold tabular-nums">
            {formData.participantsPerPurchase} <span className="text-muted-foreground text-sm font-normal">people</span>
          </span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Badge
          className={
            formData.isActive
              ? "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-200"
              : ""
          }
          variant={formData.isActive ? "outline" : "secondary"}
        >
          {formData.isActive ? "Active" : "Inactive"}
        </Badge>
        <Badge variant="outline" className="gap-1 font-mono text-xs font-normal">
          <Hash className="h-3 w-3" />
          {savedProduct.id.slice(0, 8)}…
        </Badge>
        <span className="text-muted-foreground flex items-center gap-1 text-xs">
          <Layers className="h-3.5 w-3.5" />
          {productItems.length} class{productItems.length === 1 ? "" : "es"}
          {quotaPools.length > 0 ? (
            <>
              {" "}
              · {quotaPools.length} quota pool{quotaPools.length === 1 ? "" : "s"}
            </>
          ) : null}
        </span>
      </div>

      <Separator />

      <div>
        <h4 className="text-foreground mb-3 flex items-center gap-2 text-sm font-semibold">
          Included classes
          <Badge variant="secondary" className="h-5 min-w-5 px-1.5 tabular-nums">
            {productItems.length}
          </Badge>
        </h4>
        {productItems.length === 0 ? (
          <p className="text-muted-foreground rounded-xl border border-dashed px-4 py-6 text-center text-sm">
            No classes were linked to this product.
          </p>
        ) : (
          <ul className="max-h-48 space-y-2 overflow-y-auto pr-1">
            {productItems.map((pi) => {
              const item = items.find((i) => i.id === pi.itemId);
              if (!item) return null;
              const pool = pi.quotaPoolId ? poolById.get(pi.quotaPoolId) : undefined;
              return (
                <li
                  key={`${pi.itemId}-${pi.order}-${pi.quotaType}-${pi.quotaPoolId ?? "nopool"}`}
                  className="bg-muted/30 flex items-start justify-between gap-3 rounded-xl border px-3 py-2.5"
                >
                  <div className="flex min-w-0 items-start gap-2">
                    {item.color ? (
                      <span
                        className="mt-1 h-3 w-3 flex-shrink-0 rounded-full border shadow-sm"
                        style={{ backgroundColor: item.color }}
                      />
                    ) : null}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{item.name}</p>
                      <p className="text-muted-foreground text-xs">
                        {quotaTypeLabel(pi.quotaType, pi.quotaValue, pool?.name)}
                      </p>
                    </div>
                  </div>
                  {!pi.isActive ? (
                    <Badge variant="outline" className="flex-shrink-0 text-[10px]">
                      Off
                    </Badge>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {quotaPools.length > 0 ? (
        <>
          <Separator />
          <div>
            <h4 className="text-foreground mb-3 text-sm font-semibold">Quota pools</h4>
            <ul className="space-y-2">
              {quotaPools.map((pool) => (
                <li
                  key={pool.id}
                  className="bg-muted/30 flex items-center justify-between gap-2 rounded-xl border px-3 py-2 text-sm"
                >
                  <span className="min-w-0 truncate font-medium">{pool.name}</span>
                  <span className="text-muted-foreground flex-shrink-0 text-xs tabular-nums">
                    {pool.totalQuota} total
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </>
      ) : null}
    </div>
  );
}

interface ProductSuccessStepProps {
  isEdit: boolean;
  summary: ProductSuccessSummary;
  onClose: () => void;
}

export function ProductSuccessStep({ isEdit, summary, onClose }: ProductSuccessStepProps) {
  const { formData, productItems, quotaPools, items, savedProduct } = summary;
  const poolById = React.useMemo(() => new Map(quotaPools.map((p) => [p.id, p] as const)), [quotaPools]);

  return (
    <DialogContent className="flex max-h-[92vh] w-[95vw] !max-w-[960px] flex-col gap-0 overflow-hidden p-0">
      <div className="from-primary/[0.08] via-background dark:from-primary/[0.12] relative overflow-hidden bg-gradient-to-br to-emerald-500/[0.06] dark:to-emerald-500/[0.08]">
        <ProductSuccessHero isEdit={isEdit} savedProduct={savedProduct} />

        <div className="relative max-h-[min(60vh,520px)] overflow-y-auto px-6 pb-6">
          <div className="grid gap-6 lg:grid-cols-[1fr,minmax(0,320px)]">
            <ProductSuccessSummaryPanel
              formData={formData}
              productItems={productItems}
              quotaPools={quotaPools}
              items={items}
              poolById={poolById}
              savedProduct={savedProduct}
            />

            <div className="lg:pt-1">
              <ProductPreview
                name={formData.name}
                description={formData.description}
                price={formData.price || 0}
                isOnSale={formData.isOnSale}
                salePrice={formData.salePrice}
                discountStartsAt={formData.discountStartsAt}
                discountEndsAt={formData.discountEndsAt}
                validDays={formData.validDays || 30}
                image={formData.image}
                whatIsIncluded={formData.whatIsIncluded}
                isActive={formData.isActive}
              />
            </div>
          </div>
        </div>
      </div>

      <DialogFooter className="bg-background/95 border-t px-6 py-4 backdrop-blur-sm">
        <Button onClick={onClose} className="min-w-[140px]" size="lg">
          Done
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
