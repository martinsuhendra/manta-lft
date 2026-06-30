import { z } from "zod";

import { createProductItemSchema, createQuotaPoolSchema } from "@/app/(main)/dashboard/products/_components/schema";
import { prisma } from "@/lib/generated/prisma";

export const syncProductConfigSchema = z
  .object({
    quotaPools: z.array(
      createQuotaPoolSchema.extend({
        id: z.string().optional(),
      }),
    ),
    productItems: z.array(createProductItemSchema),
  })
  .superRefine((data, ctx) => {
    const uniqueItemIds = new Set<string>();
    for (const [index, item] of data.productItems.entries()) {
      if (uniqueItemIds.has(item.itemId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Duplicate items are not allowed",
          path: ["productItems", index, "itemId"],
        });
        continue;
      }
      uniqueItemIds.add(item.itemId);
    }
  });

export type SyncProductConfigInput = z.infer<typeof syncProductConfigSchema>;

type TransactionClient = Omit<typeof prisma, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">;

function normalizeNullableNumber(value: number | null | undefined): number | null {
  if (typeof value !== "number") return null;
  return value;
}

function normalizeNullableString(value: string | null | undefined): string | null {
  if (!value) return null;
  return value;
}

async function assertRequestedItemsExist(tx: TransactionClient, itemIds: string[]) {
  if (itemIds.length === 0) return;

  const existingItems = await tx.item.findMany({
    where: { id: { in: itemIds } },
    select: { id: true },
  });
  if (existingItems.length !== itemIds.length) throw new Error("One or more selected items were not found");
}

async function syncQuotaPools(
  tx: TransactionClient,
  productId: string,
  primaryBrandId: string,
  quotaPools: SyncProductConfigInput["quotaPools"],
  existingQuotaPoolById: Map<string, Awaited<ReturnType<typeof loadExistingQuotaPools>>[number]>,
) {
  const quotaPoolIdMap = new Map<string, string>();
  const retainedQuotaPoolIds = new Set<string>();

  for (const quotaPool of quotaPools) {
    const existingQuotaPool = quotaPool.id ? existingQuotaPoolById.get(quotaPool.id) : undefined;

    if (existingQuotaPool) {
      if (existingQuotaPool._count.membershipQuotaUsage > 0 && existingQuotaPool.totalQuota !== quotaPool.totalQuota) {
        throw new Error(
          `Cannot modify total quota for "${existingQuotaPool.name}" as it has active quota usage. Members are using this pool.`,
        );
      }

      const updatedQuotaPool = await tx.quotaPool.update({
        where: { id: existingQuotaPool.id },
        data: {
          name: quotaPool.name,
          description: quotaPool.description || null,
          totalQuota: quotaPool.totalQuota,
          isActive: quotaPool.isActive,
        },
      });

      quotaPoolIdMap.set(existingQuotaPool.id, updatedQuotaPool.id);
      retainedQuotaPoolIds.add(updatedQuotaPool.id);
      continue;
    }

    const createdQuotaPool = await tx.quotaPool.create({
      data: {
        productId,
        brandId: primaryBrandId,
        name: quotaPool.name,
        description: quotaPool.description || null,
        totalQuota: quotaPool.totalQuota,
        isActive: quotaPool.isActive,
      },
    });

    if (quotaPool.id) quotaPoolIdMap.set(quotaPool.id, createdQuotaPool.id);
    retainedQuotaPoolIds.add(createdQuotaPool.id);
  }

  return { quotaPoolIdMap, retainedQuotaPoolIds };
}

async function syncProductItems(
  tx: TransactionClient,
  productId: string,
  productItems: SyncProductConfigInput["productItems"],
  existingProductItemByItemId: Map<string, Awaited<ReturnType<typeof loadExistingProductItems>>[number]>,
  quotaPoolIdMap: Map<string, string>,
  retainedQuotaPoolIds: Set<string>,
) {
  const retainedItemIds = new Set<string>();

  for (const productItem of productItems) {
    retainedItemIds.add(productItem.itemId);

    const resolvedQuotaPoolId = productItem.quotaPoolId
      ? (quotaPoolIdMap.get(productItem.quotaPoolId) ?? productItem.quotaPoolId)
      : null;

    if (resolvedQuotaPoolId && !retainedQuotaPoolIds.has(resolvedQuotaPoolId))
      throw new Error("Referenced quota pool is invalid or has been removed");

    const existingProductItem = existingProductItemByItemId.get(productItem.itemId);

    if (!existingProductItem) {
      await tx.productItem.create({
        data: {
          productId,
          itemId: productItem.itemId,
          quotaType: productItem.quotaType,
          quotaValue: normalizeNullableNumber(productItem.quotaValue),
          quotaPoolId: normalizeNullableString(resolvedQuotaPoolId),
          isActive: productItem.isActive,
          order: productItem.order,
        },
      });
      continue;
    }

    if (existingProductItem._count.membershipQuotaUsage > 0) {
      const hasRestrictedChanges =
        existingProductItem.quotaType !== productItem.quotaType ||
        normalizeNullableNumber(existingProductItem.quotaValue) !== normalizeNullableNumber(productItem.quotaValue) ||
        normalizeNullableString(existingProductItem.quotaPoolId) !== normalizeNullableString(resolvedQuotaPoolId);

      if (hasRestrictedChanges) {
        throw new Error(
          `Cannot modify quota settings for ${existingProductItem.item.name} as it has active quota usage. Members are using this item.`,
        );
      }
    }

    await tx.productItem.update({
      where: { id: existingProductItem.id },
      data: {
        quotaType: productItem.quotaType,
        quotaValue: normalizeNullableNumber(productItem.quotaValue),
        quotaPoolId: normalizeNullableString(resolvedQuotaPoolId),
        isActive: productItem.isActive,
        order: productItem.order,
      },
    });
  }

  return retainedItemIds;
}

async function pruneRemovedProductItems(
  tx: TransactionClient,
  existingProductItems: Awaited<ReturnType<typeof loadExistingProductItems>>,
  retainedItemIds: Set<string>,
) {
  for (const existingProductItem of existingProductItems) {
    if (retainedItemIds.has(existingProductItem.itemId)) continue;

    if (existingProductItem._count.membershipQuotaUsage > 0) {
      throw new Error(
        `Cannot remove ${existingProductItem.item.name} as it has existing quota usage. Members are using this item.`,
      );
    }

    await tx.productItem.delete({ where: { id: existingProductItem.id } });
  }
}

async function pruneRemovedQuotaPools(
  tx: TransactionClient,
  existingQuotaPools: Awaited<ReturnType<typeof loadExistingQuotaPools>>,
  retainedQuotaPoolIds: Set<string>,
) {
  for (const existingQuotaPool of existingQuotaPools) {
    if (retainedQuotaPoolIds.has(existingQuotaPool.id)) continue;

    if (existingQuotaPool._count.membershipQuotaUsage > 0) {
      throw new Error(
        `Cannot delete "${existingQuotaPool.name}" as it has active quota usage. Members are using this pool.`,
      );
    }

    const linkedProductItemsCount = await tx.productItem.count({
      where: { quotaPoolId: existingQuotaPool.id },
    });
    if (linkedProductItemsCount > 0) {
      throw new Error(`Cannot delete "${existingQuotaPool.name}" as it is still used by product items`);
    }

    await tx.quotaPool.delete({ where: { id: existingQuotaPool.id } });
  }
}

function loadExistingQuotaPools(tx: TransactionClient, productId: string) {
  return tx.quotaPool.findMany({
    where: { productId },
    include: {
      _count: {
        select: {
          membershipQuotaUsage: true,
        },
      },
    },
  });
}

function loadExistingProductItems(tx: TransactionClient, productId: string) {
  return tx.productItem.findMany({
    where: { productId },
    include: {
      item: true,
      _count: {
        select: {
          membershipQuotaUsage: true,
        },
      },
    },
  });
}

export async function syncProductConfiguration(productId: string, validatedData: SyncProductConfigInput) {
  return prisma.$transaction(async (tx) => {
    const product = await tx.product.findUnique({
      where: { id: productId },
      include: {
        productBrands: {
          select: { brandId: true },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!product) throw new Error("Product not found");

    const primaryBrandId = product.productBrands[0]?.brandId;
    if (!primaryBrandId) throw new Error("Product must be linked to at least one brand");

    const existingQuotaPools = await loadExistingQuotaPools(tx, productId);
    const existingQuotaPoolById = new Map(existingQuotaPools.map((pool) => [pool.id, pool]));

    const existingProductItems = await loadExistingProductItems(tx, productId);
    const existingProductItemByItemId = new Map(existingProductItems.map((item) => [item.itemId, item]));

    const requestedItemIds = [...new Set(validatedData.productItems.map((item) => item.itemId))];
    await assertRequestedItemsExist(tx, requestedItemIds);

    const { quotaPoolIdMap, retainedQuotaPoolIds } = await syncQuotaPools(
      tx,
      productId,
      primaryBrandId,
      validatedData.quotaPools,
      existingQuotaPoolById,
    );

    const retainedItemIds = await syncProductItems(
      tx,
      productId,
      validatedData.productItems,
      existingProductItemByItemId,
      quotaPoolIdMap,
      retainedQuotaPoolIds,
    );

    await pruneRemovedProductItems(tx, existingProductItems, retainedItemIds);
    await pruneRemovedQuotaPools(tx, existingQuotaPools, retainedQuotaPoolIds);

    return {
      syncedQuotaPools: validatedData.quotaPools.length,
      syncedProductItems: validatedData.productItems.length,
    };
  });
}
