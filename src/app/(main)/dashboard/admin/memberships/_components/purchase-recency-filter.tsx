"use client";

import * as React from "react";

import { useQuery } from "@tanstack/react-query";
import { format, isValid, parse } from "date-fns";
import { CalendarIcon, Filter } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

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

  const fromParsed = draftCreatedFrom ? parse(draftCreatedFrom, "yyyy-MM-dd", new Date()) : undefined;
  const toParsed = draftCreatedTo ? parse(draftCreatedTo, "yyyy-MM-dd", new Date()) : undefined;
  const safeFrom = fromParsed && isValid(fromParsed) ? fromParsed : undefined;
  const safeTo = toParsed && isValid(toParsed) ? toParsed : undefined;

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

        <div className="flex flex-col gap-3 pt-1">
          <Select
            value={draftProductId || "all"}
            onValueChange={(next) => setDraftProductId(next === "all" ? "" : next)}
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
            onValueChange={(v) => {
              setDraftValue(v as PurchaseRecencyFilterValue);
              setDraftCreatedFrom("");
              setDraftCreatedTo("");
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
                  className={cn("justify-start text-left font-normal", !createdFrom && "text-muted-foreground")}
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
                    setDraftValue("all");
                    setDraftCreatedFrom(next);
                    if (next && safeTo && date && date > safeTo) setDraftCreatedTo("");
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
                  className={cn("justify-start text-left font-normal", !createdTo && "text-muted-foreground")}
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
                    setDraftValue("all");
                    setDraftCreatedTo(date ? format(date, "yyyy-MM-dd") : "");
                  }}
                  disabled={safeFrom ? { before: safeFrom } : undefined}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <DialogFooter className="flex items-center justify-between gap-2 sm:justify-between">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={!hasDraftFilter}
              onClick={() => {
                setDraftValue("all");
                setDraftCreatedFrom("");
                setDraftCreatedTo("");
                setDraftProductId("");
              }}
            >
              Clear all filters
            </Button>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  resetDraftFromApplied();
                  setOpen(false);
                }}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={() => {
                  onChange(draftValue);
                  onCreatedFromChange(draftCreatedFrom);
                  onCreatedToChange(draftCreatedTo);
                  onProductIdChange(draftProductId);
                  setOpen(false);
                }}
                disabled={isProductsLoading}
              >
                Apply filters
              </Button>
            </div>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
