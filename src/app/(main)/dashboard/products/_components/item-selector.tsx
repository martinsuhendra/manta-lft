"use client";

import { useEffect, useState } from "react";

import { Search, Package } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

import { Item } from "../../admin/items/_components/schema";

import { ItemCard } from "./item-card";

interface ItemSelectorProps {
  selectedItems: string[];
  onItemAdd: (item: Item) => void;
  availableItems: Item[];
  quotaType: string | null;
}

export function ItemSelector({ selectedItems, onItemAdd, availableItems, quotaType }: ItemSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [pendingIds, setPendingIds] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    setPendingIds(new Set());
  }, [quotaType]);

  const filteredItems = availableItems.filter(
    (item) =>
      !selectedItems.includes(item.id) &&
      (item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase())),
  );

  function togglePending(item: Item) {
    setPendingIds((prev) => {
      const next = new Set(prev);
      if (next.has(item.id)) next.delete(item.id);
      else next.add(item.id);
      return next;
    });
  }

  function handleAddSelected() {
    if (pendingIds.size === 0) return;
    const toAdd = availableItems.filter((i) => pendingIds.has(i.id));
    for (const item of toAdd) onItemAdd(item);
    setPendingIds(new Set());
  }

  const pendingCount = pendingIds.size;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Available Items
        </CardTitle>
        <CardDescription>
          {quotaType
            ? `Click items to select multiple, then add them together. Quota: ${
                quotaType === "INDIVIDUAL" ? "individual" : quotaType === "SHARED" ? "shared pool" : "free"
              }.`
            : "Select a quota type above to start adding items"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="relative">
            <Search className="text-muted-foreground absolute top-3 left-3 h-4 w-4" />
            <Input
              placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              disabled={!quotaType}
            />
          </div>

          <div className="h-[500px] overflow-y-auto">
            {!quotaType ? (
              <div className="text-muted-foreground flex h-full items-center justify-center py-12 text-center">
                <div>
                  <p className="font-medium">Select a quota type to view available items</p>
                  <p className="mt-2 text-sm">
                    Choose how quota will be allocated before adding items to your product.
                  </p>
                </div>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="text-muted-foreground flex h-full items-center justify-center py-12 text-center">
                <div>
                  <p className="font-medium">No items available</p>
                  <p className="mt-2 text-sm">
                    {searchQuery ? "Try a different search term" : "All items have been added or no items exist"}
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid gap-3">
                {filteredItems.map((item) => (
                  <ItemCard
                    key={item.id}
                    item={item}
                    isSelected={pendingIds.has(item.id)}
                    selectionToggle
                    onAdd={() => togglePending(item)}
                    variant="available"
                    showActions={true}
                  />
                ))}
              </div>
            )}
          </div>

          {quotaType && filteredItems.length > 0 ? (
            <div className="flex items-center justify-end gap-3 border-t pt-4">
              {pendingCount > 0 ? (
                <span className="text-muted-foreground text-sm">{pendingCount} selected — click again to deselect</span>
              ) : (
                <span className="text-muted-foreground text-sm">Select one or more items, then add</span>
              )}
              <Button type="button" onClick={handleAddSelected} disabled={pendingCount === 0}>
                {pendingCount === 0
                  ? "Add to product"
                  : pendingCount === 1
                    ? "Add 1 item to product"
                    : `Add ${pendingCount} items to product`}
              </Button>
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
