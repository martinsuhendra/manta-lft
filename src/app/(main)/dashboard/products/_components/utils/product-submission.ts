import { toast } from "sonner";

import { CreateProductData } from "@/hooks/use-products-mutation";

import { FormData, mapFormDataToApiPayload } from "../hooks/use-form-validation";
import { Product, QuotaPool, CreateProductItemForm } from "../schema";

interface SubmissionParams {
  data: FormData;
  isEdit: boolean;
  product?: Product | null;
  productItems: CreateProductItemForm[];
  quotaPools: QuotaPool[];
  onConfigSaved?: (productId: string) => Promise<void> | void;
  createProduct: {
    mutateAsync: (data: CreateProductData) => Promise<Product>;
  };
  updateProduct: {
    mutateAsync: (params: { id: string; data: Partial<CreateProductData> }) => Promise<Product>;
  };
  onOpenChange: (open: boolean) => void;
  resetForm: () => void;
  showSuccessStep?: boolean; // If true, don't close dialog, let parent handle success
}

export async function handleProductSubmission({
  data,
  isEdit,
  product,
  productItems,
  quotaPools,
  onConfigSaved,
  createProduct,
  updateProduct,
  onOpenChange,
  resetForm,
  showSuccessStep = false,
}: SubmissionParams): Promise<Product> {
  try {
    const payload = mapFormDataToApiPayload(data);
    if (isEdit && product) {
      const updated = await updateProduct.mutateAsync({ id: product.id, data: payload });
      await syncEditProductItemsAndQuotaPools({
        productId: product.id,
        productItems,
        quotaPools,
      });
      await onConfigSaved?.(product.id);
      toast.success("Product updated successfully");
      if (!showSuccessStep) {
        onOpenChange(false);
      }
      return updated;
    }

    const createdProduct = await createProduct.mutateAsync(payload);
    await createQuotaPoolsAndItems(createdProduct, quotaPools, productItems);
    await onConfigSaved?.(createdProduct.id);
    toast.success("Product created successfully");

    if (!showSuccessStep) {
      onOpenChange(false);
      if (!isEdit) {
        resetForm();
      }
    } else if (!isEdit) {
      resetForm();
    }

    return createdProduct;
  } catch (error) {
    console.error(`Failed to ${isEdit ? "update" : "create"} product:`, error);
    const errorMessage = error instanceof Error ? error.message : `Failed to ${isEdit ? "update" : "create"} product`;
    toast.error(errorMessage);
    throw error;
  }
}

async function syncEditProductItemsAndQuotaPools({
  productId,
  productItems,
  quotaPools,
}: {
  productId: string;
  productItems: CreateProductItemForm[];
  quotaPools: QuotaPool[];
}) {
  const response = await fetch(`/api/admin/products/${productId}/sync-config`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      quotaPools: quotaPools.map((pool) => ({
        id: pool.id,
        name: pool.name,
        description: pool.description || undefined,
        totalQuota: pool.totalQuota,
        isActive: pool.isActive,
      })),
      productItems,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to sync product configuration: ${response.status} ${errorText}`);
  }
}

async function createQuotaPoolsAndItems(
  createdProduct: Product,
  quotaPools: QuotaPool[],
  productItems: CreateProductItemForm[],
) {
  const quotaPoolIdMap = new Map<string, string>();

  if (quotaPools.length > 0) {
    for (const pool of quotaPools) {
      const { id: tempId, ...poolData } = pool;
      const cleanPoolData = {
        name: poolData.name,
        description: poolData.description || undefined,
        totalQuota: poolData.totalQuota,
        isActive: poolData.isActive,
      };

      const response = await fetch(`/api/admin/products/${createdProduct.id}/quota-pools`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cleanPoolData),
      });

      if (response.ok) {
        const createdPool = await response.json();
        quotaPoolIdMap.set(tempId, createdPool.id);
      } else {
        const errorText = await response.text();
        throw new Error(`Failed to create quota pool: ${response.status} ${errorText}`);
      }
    }
  }

  if (productItems.length > 0) {
    const itemsWithRealPoolIds = productItems.map((item) => {
      if (item.quotaPoolId && quotaPoolIdMap.has(item.quotaPoolId)) {
        return { ...item, quotaPoolId: quotaPoolIdMap.get(item.quotaPoolId) };
      }
      return item;
    });

    const response = await fetch(`/api/admin/products/${createdProduct.id}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(itemsWithRealPoolIds),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to create product items: ${response.status} ${errorText}`);
    }
  }
}
