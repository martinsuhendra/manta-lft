import { NextRequest, NextResponse } from "next/server";

import { getServerSession } from "next-auth/next";
import { z } from "zod";

import { createProductItemSchema, createQuotaPoolSchema } from "@/app/(main)/dashboard/products/_components/schema";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/generated/prisma";
import { USER_ROLES } from "@/lib/types";

const syncProductConfigSchema = z
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

function normalizeNullableNumber(value: number | null | undefined): number | null {
  if (typeof value !== "number") return null;
  return value;
}

function normalizeNullableString(value: string | null | undefined): string | null {
  if (!value) return null;
  return value;
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (![USER_ROLES.SUPERADMIN, USER_ROLES.DEVELOPER].includes(session.user.role))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id: productId } = await params;
    const body = await request.json();
    const validatedData = syncProductConfigSchema.parse(body);

    const result = await prisma.$transaction(async (tx) => {
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

      const existingQuotaPools = await tx.quotaPool.findMany({
        where: { productId },
        include: {
          _count: {
            select: {
              membershipQuotaUsage: true,
            },
          },
        },
      });
      const existingQuotaPoolById = new Map(existingQuotaPools.map((pool) => [pool.id, pool]));

      const existingProductItems = await tx.productItem.findMany({
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
      const existingProductItemByItemId = new Map(existingProductItems.map((item) => [item.itemId, item]));

      const requestedItemIds = [...new Set(validatedData.productItems.map((item) => item.itemId))];
      if (requestedItemIds.length > 0) {
        const existingItems = await tx.item.findMany({
          where: { id: { in: requestedItemIds } },
          select: { id: true },
        });
        if (existingItems.length !== requestedItemIds.length)
          throw new Error("One or more selected items were not found");
      }

      const quotaPoolIdMap = new Map<string, string>();
      const retainedQuotaPoolIds = new Set<string>();

      for (const quotaPool of validatedData.quotaPools) {
        const existingQuotaPool = quotaPool.id ? existingQuotaPoolById.get(quotaPool.id) : undefined;

        if (existingQuotaPool) {
          if (
            existingQuotaPool._count.membershipQuotaUsage > 0 &&
            existingQuotaPool.totalQuota !== quotaPool.totalQuota
          ) {
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

      const retainedItemIds = new Set<string>();

      for (const productItem of validatedData.productItems) {
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
            normalizeNullableNumber(existingProductItem.quotaValue) !==
              normalizeNullableNumber(productItem.quotaValue) ||
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

      for (const existingProductItem of existingProductItems) {
        if (retainedItemIds.has(existingProductItem.itemId)) continue;

        if (existingProductItem._count.membershipQuotaUsage > 0) {
          throw new Error(
            `Cannot remove ${existingProductItem.item.name} as it has existing quota usage. Members are using this item.`,
          );
        }

        await tx.productItem.delete({
          where: { id: existingProductItem.id },
        });
      }

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

        await tx.quotaPool.delete({
          where: { id: existingQuotaPool.id },
        });
      }

      return {
        syncedQuotaPools: validatedData.quotaPools.length,
        syncedProductItems: validatedData.productItems.length,
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error syncing product configuration:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid data", details: error.errors }, { status: 400 });
    }

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
