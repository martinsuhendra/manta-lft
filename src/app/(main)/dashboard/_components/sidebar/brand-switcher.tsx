"use client";

import { useEffect, useState } from "react";

import Image from "next/image";

import { useQueryClient } from "@tanstack/react-query";
import { Building2, Check, ChevronsUpDown, ImageIcon } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { useAccessibleBrands } from "@/hooks/use-brands-query";
import { useBrandStore } from "@/stores/brand/brand-provider";

const ALL_ID = "ALL" as const;

function BrandLogo({ logo, name, className }: { logo?: string | null; name: string; className?: string }) {
  const [isImageBroken, setIsImageBroken] = useState(false);
  const shouldShowImage = !!logo && !isImageBroken;

  if (!shouldShowImage) {
    return (
      <span
        className={`bg-muted text-muted-foreground ring-border flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-md ring-1 ${className ?? ""}`}
        aria-hidden="true"
      >
        <ImageIcon className="size-4" />
      </span>
    );
  }

  return (
    <span
      className={`bg-muted ring-border relative size-8 shrink-0 overflow-hidden rounded-md ring-1 ${className ?? ""}`}
    >
      <Image
        src={logo}
        alt={`${name} logo`}
        fill
        sizes="96px"
        className="object-cover object-center"
        onError={() => setIsImageBroken(true)}
      />
    </span>
  );
}

export function BrandSwitcher() {
  const queryClient = useQueryClient();
  const { data: brands = [], isLoading } = useAccessibleBrands();
  const activeBrandId = useBrandStore((s) => s.activeBrandId);
  const setActiveBrand = useBrandStore((s) => s.setActiveBrand);
  const setBrands = useBrandStore((s) => s.setBrands);

  useEffect(() => {
    if (brands.length) setBrands(brands);
  }, [brands, setBrands]);

  const handleSelect = (id: string | typeof ALL_ID) => {
    setActiveBrand(id);
    queryClient.invalidateQueries();
  };

  const showAllOption = brands.length >= 2;
  const activeBrand = brands.find((b) => b.id === activeBrandId);
  const currentLabel = activeBrandId === ALL_ID ? "All Brands" : (activeBrand?.name ?? "Select brand");

  if (isLoading || brands.length === 0) return null;

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              tooltip={currentLabel}
              className="!h-auto min-h-8 py-2 group-data-[collapsible=icon]:!size-8 group-data-[collapsible=icon]:!min-h-8 group-data-[collapsible=icon]:!p-0"
            >
              {activeBrandId === ALL_ID ? (
                <Building2 className="h-4 w-4 shrink-0" />
              ) : (
                <BrandLogo logo={activeBrand?.logo} name={currentLabel} />
              )}
              <span className="truncate group-data-[collapsible=icon]:hidden">{currentLabel}</span>
              <ChevronsUpDown className="ml-auto h-4 w-4 flex-shrink-0 opacity-50 group-data-[collapsible=icon]:hidden" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="bottom" align="start" className="min-w-[200px]">
            {showAllOption && (
              <>
                <DropdownMenuItem onClick={() => handleSelect(ALL_ID)}>
                  <Building2 className="mr-2 h-4 w-4" />
                  All Brands
                  {activeBrandId === ALL_ID && <Check className="ml-auto h-4 w-4" />}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            {brands.map((b) => (
              <DropdownMenuItem key={b.id} onClick={() => handleSelect(b.id)}>
                <BrandLogo logo={b.logo} name={b.name} className="mr-2" />
                <span className="truncate">{b.name}</span>
                {activeBrandId === b.id && <Check className="ml-auto h-4 w-4" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
