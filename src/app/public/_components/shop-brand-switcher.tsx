"use client";

import { useEffect } from "react";

import { useQueryClient } from "@tanstack/react-query";
import { Building2, Check, ChevronsUpDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAccessibleBrands } from "@/hooks/use-brands-query";
import { useBrandStore } from "@/stores/brand/brand-provider";

interface ShopBrandSwitcherProps {
  mobile?: boolean;
}

export function ShopBrandSwitcher({ mobile = false }: ShopBrandSwitcherProps) {
  const queryClient = useQueryClient();
  const { data: brands = [], isLoading } = useAccessibleBrands();
  const activeBrandId = useBrandStore((state) => state.activeBrandId);
  const setActiveBrand = useBrandStore((state) => state.setActiveBrand);
  const setBrands = useBrandStore((state) => state.setBrands);

  useEffect(() => {
    if (!brands.length) return;
    setBrands(brands);

    if (brands.some((brand) => brand.id === activeBrandId)) return;
    setActiveBrand(brands[0].id);
  }, [brands, activeBrandId, setBrands, setActiveBrand]);

  if (isLoading || brands.length <= 1) return null;

  const activeBrand = brands.find((brand) => brand.id === activeBrandId) ?? brands[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {mobile ? (
          <Button variant="outline" size="sm" className="w-full justify-between">
            <span className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full border"
                style={{ backgroundColor: activeBrand.primaryColor ?? "#6366f1" }}
              />
              <span className="truncate">{activeBrand.name}</span>
            </span>
            <ChevronsUpDown className="h-4 w-4 opacity-60" />
          </Button>
        ) : (
          <Button variant="ghost" size="sm" className="max-w-[200px] justify-between">
            <span className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              <span className="truncate">{activeBrand.name}</span>
            </span>
            <ChevronsUpDown className="h-4 w-4 opacity-60" />
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align={mobile ? "center" : "end"} className="min-w-[220px]">
        {brands.map((brand) => (
          <DropdownMenuItem
            key={brand.id}
            onClick={() => {
              setActiveBrand(brand.id);
              queryClient.invalidateQueries();
            }}
          >
            <span
              className="mr-2 h-2.5 w-2.5 rounded-full border"
              style={{ backgroundColor: brand.primaryColor ?? "#6366f1" }}
            />
            <span className="truncate">{brand.name}</span>
            {activeBrand.id === brand.id && <Check className="ml-auto h-4 w-4" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
