import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { Item } from "../../admin/items/_components/schema";

import { ItemCard } from "./item-card";
import { QuotaType } from "./schema";

interface AddItemModalSelectItemsStepProps {
  selectedQuotaType: QuotaType;
  selectedQuotaValue: string;
  onSelectedQuotaValueChange: (value: string) => void;
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  filteredItems: Item[];
  pendingItemIds: Set<string>;
  onTogglePendingItem: (item: Item) => void;
  onAddPendingItems: () => void;
}

export function AddItemModalSelectItemsStep({
  selectedQuotaType,
  selectedQuotaValue,
  onSelectedQuotaValueChange,
  searchQuery,
  onSearchQueryChange,
  filteredItems,
  pendingItemIds,
  onTogglePendingItem,
  onAddPendingItems,
}: AddItemModalSelectItemsStepProps) {
  return (
    <div className="space-y-4">
      {selectedQuotaType === "INDIVIDUAL" && (
        <div>
          <Label htmlFor="quota-value">Quota Value</Label>
          <Input
            id="quota-value"
            type="number"
            min="1"
            value={selectedQuotaValue}
            onChange={(e) => onSelectedQuotaValueChange(e.target.value)}
            placeholder="Enter number of uses"
            className="mt-2"
          />
          <p className="text-muted-foreground mt-1 text-xs">Number of times this item can be used per membership</p>
        </div>
      )}

      <div>
        <Label htmlFor="search-items">Search Items</Label>
        <Input
          id="search-items"
          placeholder="Search items..."
          value={searchQuery}
          onChange={(e) => onSearchQueryChange(e.target.value)}
          className="mt-2"
        />
      </div>

      <div className="max-h-[400px] space-y-3 overflow-y-auto">
        {filteredItems.length === 0 ? (
          <div className="text-muted-foreground py-8 text-center">
            <p className="font-medium">No items available</p>
            <p className="mt-2 text-sm">{searchQuery ? "Try a different search term" : "All items have been added"}</p>
          </div>
        ) : (
          filteredItems.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              isSelected={pendingItemIds.has(item.id)}
              selectionToggle
              onAdd={() => onTogglePendingItem(item)}
              variant="available"
              showActions={true}
            />
          ))
        )}
      </div>

      {filteredItems.length > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
          <span className="text-muted-foreground text-sm">
            {pendingItemIds.size === 0
              ? "Click cards to select; add when ready"
              : `${pendingItemIds.size} selected — click again to deselect`}
          </span>
          <Button type="button" onClick={onAddPendingItems} disabled={pendingItemIds.size === 0}>
            {pendingItemIds.size === 0
              ? "Add to product"
              : pendingItemIds.size === 1
                ? "Add 1 item to product"
                : `Add ${pendingItemIds.size} items to product`}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
