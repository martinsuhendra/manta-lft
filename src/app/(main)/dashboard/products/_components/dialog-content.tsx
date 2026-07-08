/* eslint-disable max-lines */
import * as React from "react";

import { AlertTriangle } from "lucide-react";
import { UseFormReturn } from "react-hook-form";

import { ProductPriceDisplay } from "@/components/product-price-display";
import { Button } from "@/components/ui/button";
import { DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Stepper } from "@/components/ui/stepper";
import { resolveProductPricing } from "@/lib/checkout-pricing";

import { Item } from "../../admin/items/_components/schema";

import { FormData } from "./hooks/use-form-validation";
import { ProductPreview } from "./product-card";
import { ProductFormFields } from "./product-form-fields";
import { ProductItemsTab } from "./product-items-tab";
import { ProductSuccessStep, type ProductSuccessSummary } from "./product-success-step";
import { Product, QuotaPool, CreateProductItemForm } from "./schema";

interface DialogContentProps {
  isEdit: boolean;
  currentStep: number;
  setCurrentStep: (step: number) => void;
  hasAttemptedSubmit: boolean;
  hasBasicErrors: () => boolean;
  form: UseFormReturn<FormData>;
  mutation: { isPending: boolean };
  onSubmit: () => void;
  onOpenChange: (open: boolean) => void;
  product?: Product | null;
  productItems: CreateProductItemForm[];
  setProductItems: React.Dispatch<React.SetStateAction<CreateProductItemForm[]>>;
  quotaPoolsWithUsage: QuotaPool[];
  setQuotaPools: React.Dispatch<React.SetStateAction<QuotaPool[]>>;
  existingProductItemsWithUsage: CreateProductItemForm[];
  items: Item[];
  isSuccess?: boolean;
  successSummary?: ProductSuccessSummary | null;
}

const STEPS = [
  { id: "basic", label: "Basic Info", description: "Product details" },
  { id: "items", label: "Items", description: "Configure items" },
  { id: "review", label: "Review", description: "Review & submit" },
  { id: "success", label: "Success", description: "Completed" },
];

function MinimalSuccessDialogContent({
  isEdit,
  onOpenChange,
}: {
  isEdit: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <DialogContent className="flex w-[95vw] !max-w-md flex-col gap-4 p-6">
      <DialogHeader>
        <DialogTitle>{isEdit ? "Saved" : "Created"}</DialogTitle>
        <DialogDescription>Your product was saved. You can close this dialog.</DialogDescription>
      </DialogHeader>
      <DialogFooter className="sm:justify-end">
        <Button onClick={() => onOpenChange(false)}>Close</Button>
      </DialogFooter>
    </DialogContent>
  );
}

function StepContent({
  currentStep,
  form,
  mutation,
  isEdit,
  onSubmit,
  onOpenChange,
  product,
  productItems,
  setProductItems,
  quotaPoolsWithUsage,
  setQuotaPools,
  existingProductItemsWithUsage,
  items,
  hasAttemptedSubmit,
  hasBasicErrors,
  setCurrentStep,
}: {
  currentStep: number;
  form: UseFormReturn<FormData>;
  mutation: { isPending: boolean };
  isEdit: boolean;
  onSubmit: () => void;
  onOpenChange: (open: boolean) => void;
  product?: Product | null;
  productItems: CreateProductItemForm[];
  setProductItems: React.Dispatch<React.SetStateAction<CreateProductItemForm[]>>;
  quotaPoolsWithUsage: QuotaPool[];
  setQuotaPools: React.Dispatch<React.SetStateAction<QuotaPool[]>>;
  existingProductItemsWithUsage: CreateProductItemForm[];
  items: Item[];
  hasAttemptedSubmit: boolean;
  hasBasicErrors: () => boolean;
  setCurrentStep: (step: number) => void;
}) {
  if (currentStep === 1) {
    return (
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
          <div className="pr-2 pb-4">
            <ProductFormFields
              form={form}
              mutation={mutation}
              isEdit={isEdit}
              onSubmit={onSubmit}
              onCancel={() => onOpenChange(false)}
              hideButtons={true}
            />
          </div>
          <div className="flex flex-col">
            <ProductPreview
              name={form.watch("name")}
              description={form.watch("description")}
              price={form.watch("price") || 0}
              isOnSale={form.watch("isOnSale")}
              salePrice={form.watch("salePrice")}
              discountStartsAt={form.watch("discountStartsAt")}
              discountEndsAt={form.watch("discountEndsAt")}
              validDays={form.watch("validDays") || 30}
              image={form.watch("image")}
              whatIsIncluded={form.watch("whatIsIncluded")}
              isActive={form.watch("isActive")}
            />
          </div>
        </div>
      </div>
    );
  }

  if (currentStep === 2) {
    return (
      <div className="flex-1 overflow-y-auto">
        <div className="pr-2 pb-4">
          <ProductItemsTab
            productId={product?.id}
            productItems={productItems}
            setProductItems={setProductItems}
            quotaPools={quotaPoolsWithUsage}
            setQuotaPools={setQuotaPools}
            existingProductItems={existingProductItemsWithUsage}
          />
        </div>
      </div>
    );
  }

  if (currentStep === 3) {
    return (
      <div className="flex-1 overflow-y-auto pr-2 pb-4">
        <ReviewTab
          form={form}
          productItems={productItems}
          quotaPoolsWithUsage={quotaPoolsWithUsage}
          items={items}
          isEdit={isEdit}
          hasAttemptedSubmit={hasAttemptedSubmit}
          hasBasicErrors={hasBasicErrors}
          setCurrentStep={setCurrentStep}
        />
      </div>
    );
  }

  return null;
}

// eslint-disable-next-line complexity -- multi-step wizard: success branches, step routing, footer CTA matrix
export function ProductDialogContent({
  isEdit,
  currentStep,
  setCurrentStep,
  hasAttemptedSubmit,
  hasBasicErrors,
  form,
  mutation,
  onSubmit,
  onOpenChange,
  product,
  productItems,
  setProductItems,
  quotaPoolsWithUsage,
  setQuotaPools,
  existingProductItemsWithUsage,
  items,
  isSuccess = false,
  successSummary = null,
}: DialogContentProps) {
  const completedSteps = React.useMemo(() => {
    const steps: number[] = [];
    if (currentStep > 1) steps.push(1);
    if (currentStep > 2) steps.push(2);
    if (currentStep > 3) steps.push(3);
    if (isSuccess) steps.push(4);
    return steps;
  }, [currentStep, isSuccess]);

  const handleNext = async () => {
    if (currentStep === 1) {
      const isValid = await form.trigger();
      if (!isValid) return;
      setCurrentStep(2);
    } else if (currentStep === 2) {
      setCurrentStep(3);
    } else if (currentStep === 3) {
      await onSubmit();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceed = React.useMemo(() => {
    if (currentStep === 1) {
      return form.formState.isValid;
    }
    return true;
  }, [currentStep, form.formState.isValid]);

  if (isSuccess && successSummary) {
    return <ProductSuccessStep isEdit={isEdit} summary={successSummary} onClose={() => onOpenChange(false)} />;
  }

  if (isSuccess) {
    return <MinimalSuccessDialogContent isEdit={isEdit} onOpenChange={onOpenChange} />;
  }

  return (
    <DialogContent className="border-border/60 flex h-[90vh] max-h-[90vh] w-[95vw] !max-w-[1200px] flex-col overflow-hidden shadow-xl">
      <DialogHeader className="border-border/50 space-y-1.5 border-b pb-4">
        <DialogTitle className="text-xl">{isEdit ? "Edit product" : "Add product"}</DialogTitle>
        <DialogDescription className="text-sm leading-relaxed">
          {isEdit
            ? "Update pricing, details, and which classes this membership includes."
            : "Set up pricing and link the classes customers can book with this product."}
        </DialogDescription>
      </DialogHeader>

      <div className="mt-2 mb-5">
        <Stepper steps={STEPS} currentStep={currentStep} completedSteps={completedSteps} />
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <StepContent
          currentStep={currentStep}
          form={form}
          mutation={mutation}
          isEdit={isEdit}
          onSubmit={onSubmit}
          onOpenChange={onOpenChange}
          product={product}
          productItems={productItems}
          setProductItems={setProductItems}
          quotaPoolsWithUsage={quotaPoolsWithUsage}
          setQuotaPools={setQuotaPools}
          existingProductItemsWithUsage={existingProductItemsWithUsage}
          items={items}
          hasAttemptedSubmit={hasAttemptedSubmit}
          hasBasicErrors={hasBasicErrors}
          setCurrentStep={setCurrentStep}
        />
      </div>

      <DialogFooter className="border-border/50 flex flex-shrink-0 flex-col gap-3 border-t pt-4">
        {currentStep === 1 && hasAttemptedSubmit && !form.formState.isValid && (
          <div className="text-destructive flex items-center gap-2 text-sm">
            <AlertTriangle className="h-4 w-4" />
            <span>Please fix the errors above before continuing.</span>
          </div>
        )}

        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>
            Cancel
          </Button>
          {currentStep > 1 && (
            <Button type="button" variant="outline" onClick={handlePrevious} disabled={mutation.isPending}>
              Previous
            </Button>
          )}
          {currentStep < 3 ? (
            <Button
              type="button"
              onClick={handleNext}
              disabled={mutation.isPending || !canProceed}
              className="min-w-[120px]"
            >
              Next
            </Button>
          ) : (
            <Button type="button" onClick={onSubmit} disabled={mutation.isPending} className="min-w-[120px]">
              {mutation.isPending ? (
                <div className="flex items-center gap-2">
                  <div className="border-background h-4 w-4 animate-spin rounded-full border-2 border-t-transparent" />
                  {isEdit ? "Updating..." : "Creating..."}
                </div>
              ) : isEdit ? (
                "Update Product"
              ) : (
                "Create Product"
              )}
            </Button>
          )}
        </div>
      </DialogFooter>
    </DialogContent>
  );
}

interface ReviewTabProps {
  form: UseFormReturn<FormData>;
  productItems: CreateProductItemForm[];
  quotaPoolsWithUsage: QuotaPool[];
  items: Item[];
  isEdit: boolean;
  hasAttemptedSubmit: boolean;
  hasBasicErrors: () => boolean;
  setCurrentStep: (step: number) => void;
}

function ReviewPriceDisplay({ form }: { form: UseFormReturn<FormData> }) {
  const price = form.watch("price") || 0;
  const isOnSale = form.watch("isOnSale");
  const salePrice = form.watch("salePrice");
  const pricing =
    isOnSale && salePrice != null ? resolveProductPricing({ price, salePrice }) : resolveProductPricing({ price });

  return (
    <ProductPriceDisplay
      listPrice={price}
      finalPrice={pricing.priceAfterProduct}
      isOnSale={pricing.isOnSale}
      discountLabel={pricing.discountLabel}
      size="sm"
    />
  );
}

function ReviewTab({
  form,
  productItems,
  quotaPoolsWithUsage,
  items,
  isEdit,
  hasAttemptedSubmit,
  hasBasicErrors,
  setCurrentStep,
}: ReviewTabProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-4 text-lg font-medium">Review & Submit</h3>
        <p className="text-muted-foreground mb-6 text-sm">
          Review your product configuration before {isEdit ? "updating" : "creating"} it.
        </p>

        {hasAttemptedSubmit && !form.formState.isValid && (
          <div className="bg-destructive/10 border-destructive/20 mb-6 rounded-lg border p-4">
            <div className="text-destructive mb-2 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              <span className="font-medium">Form has errors</span>
            </div>
            <ul className="text-destructive space-y-1 text-sm">
              {hasBasicErrors() && (
                <li>
                  •{" "}
                  <button type="button" onClick={() => setCurrentStep(1)} className="underline hover:no-underline">
                    Fix errors in Basic Info step
                  </button>
                </li>
              )}
            </ul>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Basic Information Section */}
        <div className="bg-card rounded-lg border p-5 shadow-sm">
          <h4 className="mb-4 flex items-center gap-2 text-base font-semibold">
            <div className="bg-primary/10 text-primary rounded-md p-1.5">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            Basic Information
          </h4>
          <div className="space-y-3 text-sm">
            <div className="bg-muted/30 flex items-center justify-between rounded-md border p-3">
              <span className="text-muted-foreground font-medium">Name:</span>
              <span className="font-semibold">{form.watch("name") || "Not set"}</span>
            </div>
            <div className="bg-muted/30 flex items-center justify-between rounded-md border p-3">
              <span className="text-muted-foreground font-medium">Price:</span>
              <ReviewPriceDisplay form={form} />
            </div>
            <div className="bg-muted/30 flex items-center justify-between rounded-md border p-3">
              <span className="text-muted-foreground font-medium">Valid Days:</span>
              <span className="font-semibold">{form.watch("validDays") || 0} days</span>
            </div>
            <div className="bg-muted/30 flex items-center justify-between rounded-md border p-3">
              <span className="text-muted-foreground font-medium">Status:</span>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  form.watch("isActive")
                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                    : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
                }`}
              >
                {form.watch("isActive") ? "Active" : "Inactive"}
              </span>
            </div>
          </div>
        </div>

        {/* Items & Quota Pools Section */}
        <div className="space-y-6">
          {/* Items */}
          <div className="bg-card rounded-lg border p-5 shadow-sm">
            <h4 className="mb-4 flex items-center gap-2 text-base font-semibold">
              <div className="bg-primary/10 text-primary rounded-md p-1.5">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 10h16M4 14h16M4 18h16"
                  />
                </svg>
              </div>
              Items
              <span className="bg-primary/10 text-primary ml-auto rounded-full px-2.5 py-0.5 text-xs font-semibold">
                {productItems.length}
              </span>
            </h4>
            <div className="space-y-2">
              {productItems.length === 0 ? (
                <div className="text-muted-foreground bg-muted/20 rounded-lg border-2 border-dashed p-6 text-center text-sm">
                  <div className="bg-muted/50 mx-auto mb-2 h-12 w-12 rounded-full p-3">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="text-muted-foreground h-full w-full"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                    </svg>
                  </div>
                  <p className="font-medium">No items configured yet</p>
                  <p className="mt-1 text-xs">Go to the Items tab to add items to this product</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {productItems.map((productItem) => {
                    const item = items.find((i) => i.id === productItem.itemId);
                    if (!item) return null;

                    return (
                      <div
                        key={productItem.itemId}
                        className="bg-muted/20 hover:bg-muted/40 flex items-center justify-between rounded-lg border p-3 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          {item.color && (
                            <div
                              className="h-4 w-4 flex-shrink-0 rounded-full border-2 shadow-sm"
                              style={{ backgroundColor: item.color }}
                            />
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="font-medium">{item.name}</div>
                            <div className="text-muted-foreground text-xs">
                              {productItem.quotaType === "INDIVIDUAL" && productItem.quotaValue && (
                                <span>Individual quota: {productItem.quotaValue}</span>
                              )}
                              {productItem.quotaType === "SHARED" && productItem.quotaPoolId && (
                                <span>Shared quota pool</span>
                              )}
                              {productItem.quotaType === "FREE" && <span>Free item</span>}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                              productItem.isActive
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                                : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
                            }`}
                          >
                            {productItem.isActive ? "Active" : "Inactive"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Quota Pools */}
          {quotaPoolsWithUsage.length > 0 && (
            <div className="bg-card rounded-lg border p-5 shadow-sm">
              <h5 className="mb-4 flex items-center gap-2 text-base font-semibold">
                <div className="bg-primary/10 text-primary rounded-md p-1.5">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                    />
                  </svg>
                </div>
                Quota Pools
                <span className="bg-primary/10 text-primary ml-auto rounded-full px-2.5 py-0.5 text-xs font-semibold">
                  {quotaPoolsWithUsage.length}
                </span>
              </h5>
              <div className="space-y-2">
                {quotaPoolsWithUsage.map((pool) => (
                  <div
                    key={pool.id}
                    className="bg-muted/20 hover:bg-muted/40 flex items-center justify-between rounded-lg border p-3 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="font-medium">{pool.name}</div>
                      {pool.description && <div className="text-muted-foreground text-xs">{pool.description}</div>}
                      <div className="text-muted-foreground mt-1 text-xs">Total Quota: {pool.totalQuota}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          pool.isActive
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                            : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
                        }`}
                      >
                        {pool.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
