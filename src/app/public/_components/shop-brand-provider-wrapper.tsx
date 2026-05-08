"use client";

import { BrandStoreProvider } from "@/stores/brand/brand-provider";
import type { BrandSummary } from "@/stores/brand/brand-store";

interface ShopBrandProviderWrapperProps {
  children: React.ReactNode;
  initialActiveBrandId?: string;
  initialBrands?: BrandSummary[];
}

export function ShopBrandProviderWrapper({
  children,
  initialActiveBrandId,
  initialBrands,
}: ShopBrandProviderWrapperProps) {
  return (
    <BrandStoreProvider initialActiveBrandId={initialActiveBrandId ?? "ALL"} initialBrands={initialBrands ?? []}>
      {children}
    </BrandStoreProvider>
  );
}
