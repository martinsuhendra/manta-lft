"use client";

import * as React from "react";

import Image from "next/image";

import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Calendar, Clock, Banknote, Package, Settings } from "lucide-react";

import { ProductPriceDisplay } from "@/components/product-price-display";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { StatusBadge } from "@/components/ui/status-badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useIsMobile } from "@/hooks/use-mobile";

import { Item } from "../../admin/items/_components/schema";

import { ProductItemsDisplay } from "./product-items-display";
import { Product, QuotaPool, ProductItem } from "./schema";

interface ViewProductDialogProps {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Hooks to fetch additional product data
const useProductItems = (productId?: string) => {
  return useQuery<ProductItem[]>({
    queryKey: ["product-items", productId],
    queryFn: async () => {
      if (!productId) return [];
      const response = await fetch(`/api/admin/products/${productId}/items`);
      if (!response.ok) throw new Error("Failed to fetch product items");
      return response.json();
    },
    enabled: !!productId,
  });
};

const useQuotaPools = (productId?: string) => {
  return useQuery<QuotaPool[]>({
    queryKey: ["quota-pools", productId],
    queryFn: async () => {
      if (!productId) return [];
      const response = await fetch(`/api/admin/products/${productId}/quota-pools`);
      if (!response.ok) throw new Error("Failed to fetch quota pools");
      return response.json();
    },
    enabled: !!productId,
  });
};

const useItems = () => {
  return useQuery<Item[]>({
    queryKey: ["items"],
    queryFn: async () => {
      const response = await fetch("/api/admin/items");
      if (!response.ok) throw new Error("Failed to fetch items");
      return response.json();
    },
  });
};

// Tab Components
function BasicInfoTab({ product }: { product: Product }) {
  return (
    <div className="space-y-6">
      {/* Product Image */}
      {product.image && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Product Image</h4>
          <div className="bg-muted relative aspect-video w-full overflow-hidden rounded-lg border">
            <Image src={product.image} alt={product.name} fill className="object-cover" />
          </div>
        </div>
      )}

      {/* Basic Information */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium">Basic Information</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Banknote className="h-4 w-4" />
              Price
            </div>
            <ProductPriceDisplay
              listPrice={product.price}
              finalPrice={product.finalPrice ?? product.price}
              isOnSale={product.isOnSale}
              discountLabel={product.discountLabel}
              size="md"
            />
            {product.salePrice != null ? (
              <p className="text-muted-foreground text-xs">Configured sale price: {product.salePrice}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Clock className="h-4 w-4" />
              Valid Days
            </div>
            <p className="text-lg font-semibold">{product.validDays} days</p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Status</span>
          <StatusBadge variant={product.isActive ? "success" : "secondary"}>
            {product.isActive ? "Active" : "Inactive"}
          </StatusBadge>
        </div>
      </div>

      {/* Description */}
      {product.description && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Description</h4>
          <p className="text-muted-foreground text-sm">{product.description}</p>
        </div>
      )}

      {/* What's Included */}
      {product.whatIsIncluded && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">What&apos;s Included?</h4>
          <div
            className="text-muted-foreground prose prose-sm max-w-none text-sm [&_li]:ml-0 [&_ol]:ml-3 [&_ol]:list-decimal [&_ul]:ml-3 [&_ul]:list-disc"
            dangerouslySetInnerHTML={{ __html: product.whatIsIncluded }}
          />
        </div>
      )}

      {/* Features */}
      {product.features.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Features</h4>
          <div className="flex flex-wrap gap-1">
            {product.features.map((feature) => (
              <StatusBadge key={feature} variant="outline">
                {feature}
              </StatusBadge>
            ))}
          </div>
        </div>
      )}

      {/* Timestamps */}
      <div className="space-y-2 border-t pt-4">
        <h4 className="text-sm font-medium">Timestamps</h4>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Created</span>
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {format(new Date(product.createdAt), "MMM dd, yyyy")}
            </div>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Last Updated</span>
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {format(new Date(product.updatedAt), "MMM dd, yyyy")}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ItemsTab({
  productItems,
  quotaPools,
  items,
}: {
  productItems: ProductItem[];
  quotaPools: QuotaPool[];
  items: Item[];
}) {
  if (productItems.length === 0) {
    return (
      <div className="text-muted-foreground py-8 text-center">
        <Package className="mx-auto h-12 w-12 opacity-50" />
        <p className="mt-2">No items configured for this product yet.</p>
      </div>
    );
  }

  return <ProductItemsDisplay productItems={productItems} items={items} quotaPools={quotaPools} />;
}

function QuotaPoolsTab({ quotaPools }: { quotaPools: QuotaPool[] }) {
  if (quotaPools.length === 0) {
    return (
      <div className="text-muted-foreground py-8 text-center">
        <Settings className="mx-auto h-12 w-12 opacity-50" />
        <p className="mt-2">No quota pools configured for this product yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-medium">Quota Pools ({quotaPools.length})</h4>
      <div className="space-y-4">
        {quotaPools.map((pool) => (
          <Card key={pool.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{pool.name}</CardTitle>
                <StatusBadge variant={pool.isActive ? "success" : "secondary"}>
                  {pool.isActive ? "Active" : "Inactive"}
                </StatusBadge>
              </div>
              {pool.description && <p className="text-muted-foreground text-sm">{pool.description}</p>}
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-muted-foreground text-xs">Total Quota</span>
                  <div className="text-lg font-semibold">{pool.totalQuota}</div>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">Created</span>
                  <div className="text-sm">{format(new Date(pool.createdAt), "MMM dd, yyyy")}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function ViewProductDialog({ product, open, onOpenChange }: ViewProductDialogProps) {
  const isMobile = useIsMobile();
  const [currentTab, setCurrentTab] = React.useState("basic");

  // Fetch additional data
  const { data: productItems = [], isLoading: itemsLoading } = useProductItems(product?.id);
  const { data: quotaPools = [], isLoading: poolsLoading } = useQuotaPools(product?.id);
  const { data: items = [], isLoading: allItemsLoading } = useItems();

  if (!product) return null;

  const isLoading = itemsLoading || poolsLoading || allItemsLoading;

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction={isMobile ? "bottom" : "right"}>
      <DrawerContent className="max-w-4xl">
        <DrawerHeader className="flex-shrink-0">
          <DrawerTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            {product.name}
          </DrawerTitle>
          <DrawerDescription>Comprehensive product details, items, and quota configuration</DrawerDescription>
        </DrawerHeader>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-4">
          <Tabs value={currentTab} onValueChange={setCurrentTab} className="flex min-h-0 flex-1 flex-col">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="items" className="relative">
                Items
                {productItems.length > 0 && (
                  <StatusBadge variant="secondary" className="ml-1 h-4 px-1 text-xs">
                    {productItems.length}
                  </StatusBadge>
                )}
              </TabsTrigger>
              <TabsTrigger value="pools" className="relative">
                Quota Pools
                {quotaPools.length > 0 && (
                  <StatusBadge variant="secondary" className="ml-1 h-4 px-1 text-xs">
                    {quotaPools.length}
                  </StatusBadge>
                )}
              </TabsTrigger>
            </TabsList>

            <div className="min-h-0 flex-1 overflow-y-auto">
              <TabsContent value="basic" className="mt-6">
                <BasicInfoTab product={product} />
              </TabsContent>

              <TabsContent value="items" className="mt-6">
                {isLoading ? (
                  <div className="flex h-32 items-center justify-center">
                    <div className="text-muted-foreground text-sm">Loading items...</div>
                  </div>
                ) : (
                  <ItemsTab productItems={productItems} quotaPools={quotaPools} items={items} />
                )}
              </TabsContent>

              <TabsContent value="pools" className="mt-6">
                {isLoading ? (
                  <div className="flex h-32 items-center justify-center">
                    <div className="text-muted-foreground text-sm">Loading quota pools...</div>
                  </div>
                ) : (
                  <QuotaPoolsTab quotaPools={quotaPools} />
                )}
              </TabsContent>
            </div>
          </Tabs>
        </div>

        <DrawerFooter className="flex-shrink-0">
          <div className="flex gap-2">
            <DrawerClose asChild>
              <Button variant="outline" className="flex-1">
                Close
              </Button>
            </DrawerClose>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
