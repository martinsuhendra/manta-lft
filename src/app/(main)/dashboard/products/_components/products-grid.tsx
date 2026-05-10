"use client";

import * as React from "react";

import { ProductCard } from "./product-card";
import { ProductsTableSkeleton } from "./products-table-skeleton";
import { Product } from "./schema";

interface ProductsGridProps {
  data: Product[];
  isLoading: boolean;
  onViewProduct: (product: Product) => void;
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (product: Product) => void;
}

export function ProductsGrid({ data, isLoading, onViewProduct, onEditProduct, onDeleteProduct }: ProductsGridProps) {
  if (isLoading) return <ProductsTableSkeleton />;

  if (data.length === 0) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <h3 className="text-lg font-medium">No products found</h3>
          <p className="text-muted-foreground">Create your first product to get started.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5 xl:grid-cols-3">
      {data.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          onViewProduct={onViewProduct}
          onEditProduct={onEditProduct}
          onDeleteProduct={onDeleteProduct}
        />
      ))}
    </div>
  );
}
