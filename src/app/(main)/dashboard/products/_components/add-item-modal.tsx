"use client";

import * as React from "react";

import { CheckCircle2, Users, Infinity as InfinityIcon, ArrowLeft, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { Item } from "../../admin/items/_components/schema";

import { AddItemModalSelectItemsStep } from "./add-item-modal-select-items-step";
import { QuotaType, CreateQuotaPoolForm, QuotaPool } from "./schema";

type ModalStep = "quota-type" | "create-pool" | "select-pool" | "select-item";

interface AddItemModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  availableItems: Item[];
  selectedItemIds: string[];
  quotaPools: QuotaPool[];
  onItemAdd: (item: Item, quotaType: QuotaType, quotaValue?: number, quotaPoolId?: string) => void;
  onPoolCreate?: (pool: CreateQuotaPoolForm) => void;
}

const QUOTA_TYPE_INFO: Record<QuotaType, { icon: React.ReactNode; title: string; description: string }> = {
  INDIVIDUAL: {
    icon: <CheckCircle2 className="h-5 w-5" />,
    title: "Individual Quota",
    description: "Each membership gets a specific number of uses for this item",
  },
  SHARED: {
    icon: <Users className="h-5 w-5" />,
    title: "Shared Quota Pool",
    description: "Multiple items share a common quota pool",
  },
  FREE: {
    icon: <InfinityIcon className="h-5 w-5" />,
    title: "Free Item",
    description: "Unlimited access, no quota tracking needed",
  },
};

const DEFAULT_POOL_FORM: CreateQuotaPoolForm = {
  name: "",
  description: "",
  totalQuota: 10,
  isActive: true,
};

export function AddItemModal({
  open,
  onOpenChange,
  availableItems,
  selectedItemIds,
  quotaPools,
  onItemAdd,
  onPoolCreate,
}: AddItemModalProps) {
  const [step, setStep] = React.useState<ModalStep>("quota-type");
  const [selectedQuotaType, setSelectedQuotaType] = React.useState<QuotaType | null>(null);
  const [selectedQuotaValue, setSelectedQuotaValue] = React.useState<string>("1");
  const [selectedQuotaPoolId, setSelectedQuotaPoolId] = React.useState<string>("");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [pendingItemIds, setPendingItemIds] = React.useState<Set<string>>(() => new Set());
  const [newPool, setNewPool] = React.useState<CreateQuotaPoolForm>(DEFAULT_POOL_FORM);

  const filteredItems = availableItems.filter(
    (item) =>
      !selectedItemIds.includes(item.id) &&
      (item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase())),
  );

  const handleQuotaTypeSelect = (type: QuotaType) => {
    setSelectedQuotaType(type);
    if (type === "SHARED") {
      setStep(quotaPools.length === 0 ? "create-pool" : "select-pool");
    } else {
      setStep("select-item");
    }
  };

  const handlePoolCreate = () => {
    if (newPool.name.trim() && onPoolCreate) {
      onPoolCreate(newPool);
      setNewPool(DEFAULT_POOL_FORM);
      setStep("select-pool");
    }
  };

  // Auto-select newly created pool if we just created one and pools list updated
  React.useEffect(() => {
    if (step === "select-pool" && quotaPools.length > 0 && !selectedQuotaPoolId) {
      // Select the most recently created pool (last in array)
      const latestPool = quotaPools[quotaPools.length - 1];
      setSelectedQuotaPoolId(latestPool.id);
    }
  }, [quotaPools, step, selectedQuotaPoolId]);

  const handleAddPendingItems = () => {
    if (!selectedQuotaType || pendingItemIds.size === 0) return;

    const quotaValue = selectedQuotaType === "INDIVIDUAL" ? parseInt(selectedQuotaValue) || 1 : undefined;
    const quotaPoolId = selectedQuotaType === "SHARED" ? selectedQuotaPoolId || undefined : undefined;

    const toAdd = availableItems.filter((i) => pendingItemIds.has(i.id));
    for (const item of toAdd) onItemAdd(item, selectedQuotaType, quotaValue, quotaPoolId);
    setPendingItemIds(new Set());
  };

  function togglePendingItem(item: Item) {
    setPendingItemIds((prev) => {
      const next = new Set(prev);
      if (next.has(item.id)) next.delete(item.id);
      else next.add(item.id);
      return next;
    });
  }

  React.useEffect(() => {
    setPendingItemIds(new Set());
  }, [step, selectedQuotaType]);

  const handleClose = () => {
    setStep("quota-type");
    setSelectedQuotaType(null);
    setSelectedQuotaValue("1");
    setSelectedQuotaPoolId("");
    setSearchQuery("");
    setPendingItemIds(new Set());
    setNewPool(DEFAULT_POOL_FORM);
    onOpenChange(false);
  };

  const handleBack = () => {
    if (step === "select-item") {
      setStep(
        selectedQuotaType === "SHARED" ? (quotaPools.length === 0 ? "create-pool" : "select-pool") : "quota-type",
      );
    } else if (step === "select-pool" || step === "create-pool") {
      setStep("quota-type");
    }
  };

  const stepConfig: Record<ModalStep, { title: string; description: string }> = {
    "quota-type": {
      title: "Select Quota Type",
      description: "Choose how quota will be allocated for this item",
    },
    "create-pool": {
      title: "Create Quota Pool",
      description: "Create a shared quota pool that multiple items can use",
    },
    "select-pool": {
      title: "Select Quota Pool",
      description: "Select which quota pool this item will use",
    },
    "select-item": {
      title: "Select Items",
      description: `Select one or more items (${selectedQuotaType === "INDIVIDUAL" ? "individual" : selectedQuotaType === "SHARED" ? "shared pool" : "free"} quota). Add when ready — the dialog stays open.`,
    },
  };

  // eslint-disable-next-line security/detect-object-injection -- step is a known ModalStep key
  const currentStep = stepConfig[step];

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) handleClose();
      }}
    >
      <DialogContent className="flex max-h-[90vh] max-w-2xl flex-col overflow-hidden">
        <DialogHeader>
          <div className="flex items-center gap-3">
            {step !== "quota-type" && (
              <Button type="button" variant="ghost" size="icon" onClick={handleBack}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <div className="flex-1">
              <DialogTitle>{currentStep.title}</DialogTitle>
              <DialogDescription>{currentStep.description}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {step === "quota-type" && (
            <div className="space-y-4">
              <RadioGroup
                value={selectedQuotaType || undefined}
                onValueChange={(value) => handleQuotaTypeSelect(value as QuotaType)}
                className="grid grid-cols-1 gap-4"
              >
                {(Object.keys(QUOTA_TYPE_INFO) as QuotaType[]).map((type) => {
                  // eslint-disable-next-line security/detect-object-injection -- type is from QUOTA_TYPE_INFO keys
                  const info = QUOTA_TYPE_INFO[type];
                  const isSelected = selectedQuotaType === type;

                  return (
                    <div key={type} className="flex">
                      <RadioGroupItem value={type} id={type} className="peer sr-only" />
                      <Label
                        htmlFor={type}
                        className={`hover:border-primary/50 flex w-full cursor-pointer flex-col items-start gap-3 rounded-lg border-2 p-4 transition-all ${
                          isSelected ? "border-primary bg-primary/5" : "border-border"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`mt-0.5 flex-shrink-0 rounded-full p-2 ${
                              isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {info.icon}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-semibold">{info.title}</div>
                            <p className="text-muted-foreground mt-1 text-sm">{info.description}</p>
                          </div>
                        </div>
                      </Label>
                    </div>
                  );
                })}
              </RadioGroup>
            </div>
          )}

          {step === "create-pool" && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="pool-name">Pool Name</Label>
                <Input
                  id="pool-name"
                  placeholder="e.g., Group Classes"
                  value={newPool.name}
                  onChange={(e) => setNewPool((prev) => ({ ...prev, name: e.target.value }))}
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="pool-description">Description (optional)</Label>
                <Input
                  id="pool-description"
                  placeholder="e.g., Shared quota for all group classes"
                  value={newPool.description}
                  onChange={(e) => setNewPool((prev) => ({ ...prev, description: e.target.value }))}
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="pool-quota">Total Quota</Label>
                <Input
                  id="pool-quota"
                  type="number"
                  min="1"
                  value={newPool.totalQuota}
                  onChange={(e) => setNewPool((prev) => ({ ...prev, totalQuota: parseInt(e.target.value) || 1 }))}
                  className="mt-2"
                />
                <p className="text-muted-foreground mt-1 text-xs">
                  Total number of uses available across all items using this pool
                </p>
              </div>
              <div className="flex gap-2 pt-2">
                <Button onClick={handlePoolCreate} disabled={!newPool.name.trim()}>
                  Create Pool & Continue
                </Button>
              </div>
            </div>
          )}

          {step === "select-pool" && (
            <div className="space-y-4">
              {quotaPools.length === 0 ? (
                <div className="text-muted-foreground py-8 text-center">
                  <p className="font-medium">No quota pools available</p>
                  <p className="mt-2 text-sm">Create a quota pool first to use shared quota</p>
                  <Button className="mt-4" onClick={() => setStep("create-pool")}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Quota Pool
                  </Button>
                </div>
              ) : (
                <>
                  <div>
                    <Label className="mb-2">Select Quota Pool</Label>
                    <Select value={selectedQuotaPoolId} onValueChange={setSelectedQuotaPoolId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a pool" />
                      </SelectTrigger>
                      <SelectContent>
                        {quotaPools.map((pool) => (
                          <SelectItem key={pool.id} value={pool.id}>
                            {pool.name} ({pool.totalQuota} quota)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => setStep("select-item")} disabled={!selectedQuotaPoolId} className="flex-1">
                      Continue
                    </Button>
                    <Button variant="outline" onClick={() => setStep("create-pool")}>
                      <Plus className="mr-2 h-4 w-4" />
                      Create New Pool
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}

          {step === "select-item" && selectedQuotaType ? (
            <AddItemModalSelectItemsStep
              selectedQuotaType={selectedQuotaType}
              selectedQuotaValue={selectedQuotaValue}
              onSelectedQuotaValueChange={setSelectedQuotaValue}
              searchQuery={searchQuery}
              onSearchQueryChange={setSearchQuery}
              filteredItems={filteredItems}
              pendingItemIds={pendingItemIds}
              onTogglePendingItem={togglePendingItem}
              onAddPendingItems={handleAddPendingItems}
            />
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
