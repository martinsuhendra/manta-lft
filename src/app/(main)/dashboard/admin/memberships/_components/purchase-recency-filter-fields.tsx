"use client";

import * as React from "react";

import { format, isValid, parse } from "date-fns";
import { CalendarIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { DialogFooter } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

import type { PurchaseRecencyFilterValue } from "./purchase-recency-filter";

interface ProductOption {
  id: string;
  name: string;
}

interface PurchaseRecencyFilterFieldsProps {
  products: ProductOption[];
  isProductsLoading: boolean;
  draftValue: PurchaseRecencyFilterValue;
  draftCreatedFrom: string;
  draftCreatedTo: string;
  draftProductId: string;
  hasDraftFilter: boolean;
  onDraftValueChange: (value: PurchaseRecencyFilterValue) => void;
  onDraftCreatedFromChange: (value: string) => void;
  onDraftCreatedToChange: (value: string) => void;
  onDraftProductIdChange: (value: string) => void;
  onClearDraft: () => void;
  onCancel: () => void;
  onApply: () => void;
}

export function PurchaseRecencyFilterFields({
  products,
  isProductsLoading,
  draftValue,
  draftCreatedFrom,
  draftCreatedTo,
  draftProductId,
  hasDraftFilter,
  onDraftValueChange,
  onDraftCreatedFromChange,
  onDraftCreatedToChange,
  onDraftProductIdChange,
  onClearDraft,
  onCancel,
  onApply,
}: PurchaseRecencyFilterFieldsProps) {
  const fromParsed = draftCreatedFrom ? parse(draftCreatedFrom, "yyyy-MM-dd", new Date()) : undefined;
  const toParsed = draftCreatedTo ? parse(draftCreatedTo, "yyyy-MM-dd", new Date()) : undefined;
  const safeFrom = fromParsed && isValid(fromParsed) ? fromParsed : undefined;
  const safeTo = toParsed && isValid(toParsed) ? toParsed : undefined;

  return (
    <div className="flex flex-col gap-3 pt-1">
      <Select
        value={draftProductId || "all"}
        onValueChange={(next) => onDraftProductIdChange(next === "all" ? "" : next)}
      >
        <SelectTrigger>
          <SelectValue placeholder="Filter by product" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All products</SelectItem>
          {products.map((product) => (
            <SelectItem key={product.id} value={product.id}>
              {product.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={draftValue}
        onValueChange={(value) => {
          onDraftValueChange(value as PurchaseRecencyFilterValue);
          onDraftCreatedFromChange("");
          onDraftCreatedToChange("");
        }}
      >
        <SelectTrigger>
          <SelectValue placeholder="Created within" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Any time</SelectItem>
          <SelectItem value="7d">Created within 7 days</SelectItem>
          <SelectItem value="1m">Created within 1 month</SelectItem>
          <SelectItem value="3m">Created within 3 months</SelectItem>
          <SelectItem value="1y">Created within 1 year</SelectItem>
        </SelectContent>
      </Select>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className={cn("justify-start text-left font-normal", !draftCreatedFrom && "text-muted-foreground")}
            >
              <CalendarIcon className="mr-2 h-4 w-4 opacity-50" />
              <span className="truncate">{safeFrom ? format(safeFrom, "MMM d, yyyy") : "Start date"}</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={safeFrom}
              onSelect={(date) => {
                const next = date ? format(date, "yyyy-MM-dd") : "";
                onDraftValueChange("all");
                onDraftCreatedFromChange(next);
                if (next && safeTo && date && date > safeTo) onDraftCreatedToChange("");
              }}
              disabled={safeTo ? { after: safeTo } : undefined}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className={cn("justify-start text-left font-normal", !draftCreatedTo && "text-muted-foreground")}
            >
              <CalendarIcon className="mr-2 h-4 w-4 opacity-50" />
              <span className="truncate">{safeTo ? format(safeTo, "MMM d, yyyy") : "End date"}</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={safeTo}
              onSelect={(date) => {
                onDraftValueChange("all");
                onDraftCreatedToChange(date ? format(date, "yyyy-MM-dd") : "");
              }}
              disabled={safeFrom ? { before: safeFrom } : undefined}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      <DialogFooter className="flex items-center justify-between gap-2 sm:justify-between">
        <Button type="button" variant="ghost" size="sm" disabled={!hasDraftFilter} onClick={onClearDraft}>
          Clear all filters
        </Button>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="button" onClick={onApply} disabled={isProductsLoading}>
            Apply filters
          </Button>
        </div>
      </DialogFooter>
    </div>
  );
}
