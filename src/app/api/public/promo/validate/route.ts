import { NextRequest, NextResponse } from "next/server";

import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/auth";
import { resolveActiveBrandIdFromCookie } from "@/lib/brand-cookie";
import { prisma } from "@/lib/generated/prisma";
import { resolvePurchasePricing } from "@/lib/purchase-pricing";

const validateSchema = z.object({
  productId: z.string().uuid(),
  promoCode: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { productId, promoCode } = validateSchema.parse(body);

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { productBrands: { select: { brandId: true } } },
    });
    if (!product || !product.isActive || !product.isPublic) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const productBrandIds = product.productBrands.map((pb) => pb.brandId);
    const cookieBrandId = await resolveActiveBrandIdFromCookie();
    const brandId = cookieBrandId && productBrandIds.includes(cookieBrandId) ? cookieBrandId : productBrandIds[0];
    if (!brandId) {
      return NextResponse.json({ error: "Product is not linked to any brand" }, { status: 400 });
    }

    const pricing = await resolvePurchasePricing({
      product,
      productId,
      brandId,
      userId: session.user.id,
      promoCode,
    });

    return NextResponse.json({
      valid: true,
      listPrice: pricing.listPrice,
      productDiscountAmount: pricing.productDiscountAmount,
      promoDiscountAmount: pricing.promoDiscountAmount,
      finalAmount: pricing.finalAmount,
      totalDiscountAmount: pricing.totalDiscountAmount,
      promoCode: pricing.promoCode,
      isOnSale: pricing.isOnSale,
      discountLabel: pricing.discountLabel,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.errors }, { status: 400 });
    }
    return NextResponse.json(
      { valid: false, error: error instanceof Error ? error.message : "Invalid promo code" },
      { status: 400 },
    );
  }
}
