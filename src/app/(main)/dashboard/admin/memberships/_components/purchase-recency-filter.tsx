"use client";

import * as React from "react";

import { useQuery } from "@tanstack/react-query";
import { Filter } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

import { PurchaseRecencyFilterFields } from "./purchase-recency-filter-fields";

export type PurchaseRecencyFilterValue = "all" | "7d" | "1m" | "3m" | "1y";

interface PurchaseRecencyFilterProps {
  value: PurchaseRecencyFilterValue;
  onChange: (value: PurchaseRecencyFilterValue) => void;
  createdFrom: string;
  createdTo: string;
  onCreatedFromChange: (isoDate: string) => void;
  onCreatedToChange: (isoDate: string) => void;
  productId: string;
  onProductIdChange: (productId: string) => void;
}

interface ProductOption {
  id: string;
  name: string;
}

export function PurchaseRecencyFilter({
  value,
  onChange,
  createdFrom,
  createdTo,
  onCreatedFromChange,
  onCreatedToChange,
  productId,
  onProductIdChange,
}: PurchaseRecencyFilterProps) {
  const [open, setOpen] = React.useState(false);
  const [draftValue, setDraftValue] = React.useState<PurchaseRecencyFilterValue>(value);
  const [draftCreatedFrom, setDraftCreatedFrom] = React.useState(createdFrom);
  const [draftCreatedTo, setDraftCreatedTo] = React.useState(createdTo);
  const [draftProductId, setDraftProductId] = React.useState(productId);

  const { data: products = [], isLoading: isProductsLoading } = useQuery<ProductOption[]>({
    queryKey: ["products", "membership-filter"],
    queryFn: async () => {
      const response = await fetch("/api/products");
      if (!response.ok) throw new Error("Failed to load products");
      return response.json();
    },
    enabled: open,
  });

  const hasDates = Boolean(createdFrom || createdTo);
  const hasActiveFilter = value !== "all" || hasDates || Boolean(productId);
  const hasDraftDates = Boolean(draftCreatedFrom || draftCreatedTo);
  const hasDraftFilter = draftValue !== "all" || hasDraftDates || Boolean(draftProductId);

  function resetDraftFromApplied() {
    setDraftValue(value);
    setDraftCreatedFrom(createdFrom);
    setDraftCreatedTo(createdTo);
    setDraftProductId(productId);
  }

  function clearDraft() {
    setDraftValue("all");
    setDraftCreatedFrom("");
    setDraftCreatedTo("");
    setDraftProductId("");
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (nextOpen) resetDraftFromApplied();
      }}
    >
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className={cn("relative", hasActiveFilter && "border-primary text-primary")}
          aria-label="Open membership date filters"
        >
          <Filter className="h-4 w-4" />
          {hasActiveFilter ? <span className="bg-primary absolute top-1 right-1 h-2 w-2 rounded-full" /> : null}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>Membership Filters</DialogTitle>
          <DialogDescription>Filter by created date preset or custom date range.</DialogDescription>
        </DialogHeader>

        <PurchaseRecencyFilterFields
          products={products}
          isProductsLoading={isProductsLoading}
          draftValue={draftValue}
          draftCreatedFrom={draftCreatedFrom}
          draftCreatedTo={draftCreatedTo}
          draftProductId={draftProductId}
          hasDraftFilter={hasDraftFilter}
          onDraftValueChange={setDraftValue}
          onDraftCreatedFromChange={setDraftCreatedFrom}
          onDraftCreatedToChange={setDraftCreatedTo}
          onDraftProductIdChange={setDraftProductId}
          onClearDraft={clearDraft}
          onCancel={() => {
            resetDraftFromApplied();
            setOpen(false);
          }}
          onApply={() => {
            onChange(draftValue);
            onCreatedFromChange(draftCreatedFrom);
            onCreatedToChange(draftCreatedTo);
            onProductIdChange(draftProductId);
            setOpen(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
