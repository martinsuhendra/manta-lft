"use client";

import * as React from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";

import { ProductDialogContent } from "./dialog-content";
import { useFormEffects } from "./form-effects";
import { useDialogState } from "./hooks/use-dialog-state";
import { useFormValidation, formSchema, FormData, DEFAULT_FORM_VALUES } from "./hooks/use-form-validation";
import { useProductComputed } from "./hooks/use-product-computed";
import { useProductData } from "./hooks/use-product-data";
import { useProductMutation } from "./hooks/use-product-mutation";
import type { ProductSuccessSummary } from "./product-success-step";
import { Product, QuotaPool, CreateProductItemForm } from "./schema";
import { handleProductSubmission } from "./utils/product-submission";

interface ProductFormTabbedDialogProps {
  mode: "add" | "edit";
  product?: Product | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
}

export function ProductFormTabbedDialog({
  mode,
  product = null,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  trigger,
}: ProductFormTabbedDialogProps) {
  const queryClient = useQueryClient();
  const { open, onOpenChange } = useDialogState({ open: controlledOpen, onOpenChange: controlledOnOpenChange });
  const { isEdit, mutation, createProduct, updateProduct } = useProductMutation(mode);

  const [currentStep, setCurrentStep] = React.useState(1);
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = React.useState(false);
  const [isSuccess, setIsSuccess] = React.useState(false);
  const [successSummary, setSuccessSummary] = React.useState<ProductSuccessSummary | null>(null);
  const [productItems, setProductItems] = React.useState<CreateProductItemForm[]>([]);
  const [quotaPools, setQuotaPools] = React.useState<QuotaPool[]>([]);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: DEFAULT_FORM_VALUES,
  });

  const { hasBasicErrors } = useFormValidation(form);
  const selectedBrandIds = form.watch("brandIds");
  const { items, existingProductItems, existingQuotaPools } = useProductData(product?.id, isEdit, selectedBrandIds);

  useFormEffects({
    form,
    isEdit,
    product,
    open,
    existingProductItems,
    existingQuotaPools,
    setProductItems,
    setQuotaPools,
    setCurrentTab: () => {}, // No longer needed, but keeping for compatibility
    setHasAttemptedSubmit,
  });

  // Reset step and success state when dialog opens/closes
  React.useEffect(() => {
    if (open) {
      setCurrentStep(1);
      setIsSuccess(false);
      setSuccessSummary(null);
      setHasAttemptedSubmit(false);
    }
  }, [open]);

  const { existingProductItemsWithUsage, quotaPoolsWithUsage } = useProductComputed({
    isEdit,
    existingProductItems,
    existingQuotaPools,
    quotaPools,
  });

  const onSubmit = async (data: FormData) => {
    setHasAttemptedSubmit(true);

    const isValid = await form.trigger();
    if (!isValid) {
      if (hasBasicErrors()) {
        setCurrentStep(1);
        toast.error("Please fix the errors in the Basic Info step.");
      }
      return;
    }

    try {
      const savedProduct = await handleProductSubmission({
        data,
        isEdit,
        product,
        productItems,
        quotaPools,
        onConfigSaved: async (savedProductId: string) => {
          await Promise.all([
            queryClient.invalidateQueries({ queryKey: ["products"] }),
            queryClient.invalidateQueries({ queryKey: ["product-items", savedProductId] }),
            queryClient.invalidateQueries({ queryKey: ["product-items-with-usage", savedProductId] }),
            queryClient.invalidateQueries({ queryKey: ["quota-pools", savedProductId] }),
          ]);
        },
        createProduct,
        updateProduct,
        onOpenChange,
        resetForm: () => form.reset(),
        showSuccessStep: true,
      });
      setSuccessSummary({
        formData: { ...data },
        productItems: productItems.map((p) => ({ ...p })),
        quotaPools: quotaPools.map((p) => ({ ...p })),
        items: [...items],
        savedProduct,
      });
      setIsSuccess(true);
      setCurrentStep(4);
    } catch {
      // Error is already handled in handleProductSubmission
    }
  };

  const dialogContent = (
    <ProductDialogContent
      isEdit={isEdit}
      currentStep={currentStep}
      setCurrentStep={setCurrentStep}
      hasAttemptedSubmit={hasAttemptedSubmit}
      hasBasicErrors={hasBasicErrors}
      form={form}
      mutation={mutation}
      onSubmit={form.handleSubmit(onSubmit)}
      onOpenChange={onOpenChange}
      product={product}
      productItems={productItems}
      setProductItems={setProductItems}
      quotaPoolsWithUsage={quotaPoolsWithUsage}
      setQuotaPools={setQuotaPools}
      existingProductItemsWithUsage={existingProductItemsWithUsage}
      items={items}
      isSuccess={isSuccess}
      successSummary={successSummary}
    />
  );

  // If no trigger provided (for edit mode), return just the dialog content
  if (!trigger) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        {dialogContent}
      </Dialog>
    );
  }

  // For add mode with trigger
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      {dialogContent}
    </Dialog>
  );
}

// Convenience wrapper for Add Product
export function AddProductTabbedDialog() {
  return (
    <ProductFormTabbedDialog
      mode="add"
      trigger={
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Product
        </Button>
      }
    />
  );
}

// Alias for compatibility
export const AddProductDialog = AddProductTabbedDialog;
