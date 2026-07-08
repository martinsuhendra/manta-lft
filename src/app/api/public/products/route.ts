import { NextResponse } from "next/server";

import { resolveActiveBrandIdFromCookie } from "@/lib/brand-cookie";
import { prisma } from "@/lib/generated/prisma";
import { serializePublicProduct } from "@/lib/product-serializer";

export async function GET() {
  try {
    const activeBrandId = await resolveActiveBrandIdFromCookie();
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        isPublic: true,
        ...(activeBrandId ? { productBrands: { some: { brandId: activeBrandId } } } : {}),
      },
      orderBy: { position: "asc" },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        salePrice: true,
        discountStartsAt: true,
        discountEndsAt: true,
        validDays: true,
        image: true,
        imageAsset: true,
        paymentUrl: true,
        whatIsIncluded: true,
        features: true,
        createdAt: true,
        isPurchaseUnlimited: true,
        purchaseLimitPerUser: true,
        isActive: true,
        isPublic: true,
        participantsPerPurchase: true,
        position: true,
        updatedAt: true,
        productBrands: {
          select: { brandId: true, brand: { select: { id: true, name: true } } },
        },
      },
    });

    return NextResponse.json(
      products.map((product) => serializePublicProduct(product)),
      {
        headers: { "Cache-Control": "private, no-store" },
      },
    );
  } catch (error) {
    console.error("Failed to fetch public products:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch products",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
