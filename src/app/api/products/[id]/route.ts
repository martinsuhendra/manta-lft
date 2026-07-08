/* eslint-disable complexity */
import { NextRequest, NextResponse } from "next/server";

import { Prisma } from "@prisma/client";
import { z } from "zod";

import { handleApiError, requireAuth, requireSuperAdmin } from "@/lib/api-utils";
import { deleteCloudinaryAsset } from "@/lib/cloudinary";
import { parseCloudinaryAsset, resolveAssetUrl } from "@/lib/cloudinary-asset";
import { prisma } from "@/lib/generated/prisma";
import {
  parseOptionalDateTime,
  productDiscountFieldsSchema,
  refineProductDiscount,
} from "@/lib/product-discount-schema";
import { serializeAdminProduct } from "@/lib/product-serializer";

const updateProductSchema = z
  .object({
    brandIds: z.array(z.string().uuid("Invalid brand ID")).min(1, "Select at least one brand").optional(),
    name: z.string().min(1, "Name is required").optional(),
    description: z.string().optional(),
    price: z.number().min(0, "Price must be at least 0").optional(),
    validDays: z.number().positive("Valid days must be positive").optional(),
    quota: z.number().positive("Quota must be positive").optional(),
    isPurchaseUnlimited: z.boolean().optional(),
    purchaseLimitPerUser: z.number().int().min(1, "Purchase limit must be at least 1").nullable().optional(),
    features: z.array(z.string()).optional(),
    image: z.string().optional(),
    imageAsset: z.unknown().nullable().optional(),
    paymentUrl: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
    whatIsIncluded: z.string().optional(),
    participantsPerPurchase: z.number().int().min(1).max(10).optional(),
    isActive: z.boolean().optional(),
    isPublic: z.boolean().optional(),
  })
  .merge(productDiscountFieldsSchema)
  .superRefine((data, ctx) => {
    if (typeof data.price === "number" && data.salePrice != null) {
      refineProductDiscount({ price: data.price, salePrice: data.salePrice }, ctx);
    }
    const hasUnlimitedFlag = typeof data.isPurchaseUnlimited === "boolean";
    const hasPurchaseLimit = Object.prototype.hasOwnProperty.call(data, "purchaseLimitPerUser");
    if (!hasUnlimitedFlag && !hasPurchaseLimit) return;
    const isUnlimited = data.isPurchaseUnlimited ?? false;
    if (isUnlimited) return;
    if (typeof data.purchaseLimitPerUser === "number" && data.purchaseLimitPerUser >= 1) return;
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Purchase limit per user is required when unlimited is disabled",
      path: ["purchaseLimitPerUser"],
    });
  });

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { error } = await requireAuth();
    if (error) return error;

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        productBrands: {
          select: {
            brandId: true,
            brand: { select: { id: true, name: true } },
          },
        },
        _count: {
          select: { memberships: true, transactions: true },
        },
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json(serializeAdminProduct(product));
  } catch (error) {
    return handleApiError(error, "Failed to fetch membership product");
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { error } = await requireSuperAdmin();
    if (error) return error;

    const body = await request.json();
    const validatedData = updateProductSchema.parse(body);
    const {
      brandIds,
      imageAsset: imageAssetInput,
      salePrice,
      discountStartsAt,
      discountEndsAt,
      ...updateData
    } = validatedData;
    const existingProduct = await prisma.product.findUnique({
      where: { id },
      select: { imageAsset: true },
    });

    if (!existingProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const previousAsset = parseCloudinaryAsset(existingProduct.imageAsset);
    const nextAsset = imageAssetInput === undefined ? previousAsset : parseCloudinaryAsset(imageAssetInput);
    const nextAssetForDb = imageAssetInput === undefined ? undefined : nextAsset ? nextAsset : Prisma.JsonNull;
    const shouldDeletePrevious =
      !!previousAsset &&
      (!nextAsset ||
        previousAsset.publicId !== nextAsset.publicId ||
        imageAssetInput === null ||
        validatedData.image === "");

    if (brandIds) {
      const brands = await prisma.brand.findMany({
        where: { id: { in: brandIds }, isActive: true },
        select: { id: true },
      });
      if (brands.length !== brandIds.length) {
        return NextResponse.json({ error: "One or more selected brands are invalid or inactive" }, { status: 400 });
      }
    }

    const product = await prisma.product.update({
      where: { id },
      data: {
        ...updateData,
        ...(Object.prototype.hasOwnProperty.call(validatedData, "salePrice") && {
          salePrice: salePrice ?? null,
        }),
        ...(Object.prototype.hasOwnProperty.call(validatedData, "discountStartsAt") && {
          discountStartsAt: parseOptionalDateTime(discountStartsAt),
        }),
        ...(Object.prototype.hasOwnProperty.call(validatedData, "discountEndsAt") && {
          discountEndsAt: parseOptionalDateTime(discountEndsAt),
        }),
        ...(imageAssetInput !== undefined && {
          imageAsset: nextAssetForDb,
          image: resolveAssetUrl(nextAsset, validatedData.image),
        }),
        ...(brandIds && {
          productBrands: {
            deleteMany: {},
            create: brandIds.map((brandId) => ({ brandId })),
          },
        }),
      },
      include: {
        productBrands: {
          select: {
            brandId: true,
            brand: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (shouldDeletePrevious) {
      deleteCloudinaryAsset({ publicId: previousAsset.publicId }).catch((error: unknown) => {
        console.warn("Failed to delete previous Cloudinary product image:", error);
      });
    }

    return NextResponse.json(serializeAdminProduct(product));
  } catch (error) {
    return handleApiError(error, "Failed to update membership product");
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { error } = await requireSuperAdmin();
    if (error) return error;

    const existingTransactions = await prisma.transaction.findFirst({
      where: { productId: id },
    });

    if (existingTransactions) {
      return NextResponse.json(
        {
          error: "Cannot delete product with existing transactions. Please deactivate the product instead.",
        },
        { status: 400 },
      );
    }

    const product = await prisma.product.findUnique({
      where: { id },
      select: { imageAsset: true },
    });

    await prisma.product.delete({
      where: { id },
    });

    const imageAsset = parseCloudinaryAsset(product?.imageAsset);
    if (imageAsset) {
      deleteCloudinaryAsset({ publicId: imageAsset.publicId }).catch((error: unknown) => {
        console.warn("Failed to delete Cloudinary product image on delete:", error);
      });
    }

    return NextResponse.json({ message: "Membership product deleted successfully" });
  } catch (error) {
    return handleApiError(error, "Failed to delete membership product");
  }
}
