import { NextRequest, NextResponse } from "next/server";

import { z } from "zod";

import { handleApiError, requireAdmin, requireBrandAccess } from "@/lib/api-utils";
import { normalizePromoCode } from "@/lib/checkout-pricing";
import { prisma } from "@/lib/generated/prisma";

const createPromoCodeSchema = z.object({
  code: z.string().min(1, "Code is required").max(50),
  brandId: z.string().uuid("Invalid brand ID"),
  discountType: z.enum(["PERCENT", "FIXED"]),
  discountValue: z.number().positive("Discount value must be positive"),
  maxDiscountAmount: z.number().positive().nullable().optional(),
  startsAt: z.string().nullable().optional(),
  endsAt: z.string().nullable().optional(),
  usageLimit: z.number().int().positive().nullable().optional(),
  perUserLimit: z.number().int().positive().optional().default(1),
  applicableProductIds: z.array(z.string().uuid()).optional().default([]),
  isActive: z.boolean().optional().default(true),
});

function parseOptionalDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function serializePromoCode(promo: {
  id: string;
  code: string;
  brandId: string;
  discountType: string;
  discountValue: unknown;
  maxDiscountAmount: unknown;
  startsAt: Date | null;
  endsAt: Date | null;
  usageLimit: number | null;
  usageCount: number;
  perUserLimit: number;
  applicableProductIds: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  brand?: { id: string; name: string };
  _count?: { redemptions: number };
}) {
  return {
    id: promo.id,
    code: promo.code,
    brandId: promo.brandId,
    brand: promo.brand,
    discountType: promo.discountType,
    discountValue: Number(promo.discountValue),
    maxDiscountAmount: promo.maxDiscountAmount != null ? Number(promo.maxDiscountAmount) : null,
    startsAt: promo.startsAt?.toISOString() ?? null,
    endsAt: promo.endsAt?.toISOString() ?? null,
    usageLimit: promo.usageLimit,
    usageCount: promo.usageCount,
    perUserLimit: promo.perUserLimit,
    applicableProductIds: promo.applicableProductIds,
    isActive: promo.isActive,
    redemptionCount: promo._count?.redemptions ?? promo.usageCount,
    createdAt: promo.createdAt.toISOString(),
    updatedAt: promo.updatedAt.toISOString(),
  };
}

export async function GET(request: NextRequest) {
  try {
    const { error, brandIds } = await requireBrandAccess(request);
    if (error) return error;

    const activeBrandId = request.headers.get("x-brand-id");
    const brandFilter =
      activeBrandId && activeBrandId !== "ALL"
        ? { brandId: activeBrandId }
        : brandIds?.length
          ? { brandId: { in: brandIds } }
          : {};

    const promoCodes = await prisma.promoCode.findMany({
      where: brandFilter,
      orderBy: { createdAt: "desc" },
      include: {
        brand: { select: { id: true, name: true } },
        _count: { select: { redemptions: true } },
      },
    });

    return NextResponse.json(promoCodes.map(serializePromoCode));
  } catch (err) {
    return handleApiError(err, "Failed to fetch promo codes");
  }
}

export async function POST(request: NextRequest) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const body = await request.json();
    const validated = createPromoCodeSchema.parse(body);
    const code = normalizePromoCode(validated.code);

    const existing = await prisma.promoCode.findFirst({
      where: { brandId: validated.brandId, code },
    });
    if (existing) {
      return NextResponse.json({ error: "Promo code already exists for this brand" }, { status: 400 });
    }

    const promo = await prisma.promoCode.create({
      data: {
        code,
        brandId: validated.brandId,
        discountType: validated.discountType,
        discountValue: validated.discountValue,
        maxDiscountAmount: validated.maxDiscountAmount ?? null,
        startsAt: parseOptionalDate(validated.startsAt),
        endsAt: parseOptionalDate(validated.endsAt),
        usageLimit: validated.usageLimit ?? null,
        perUserLimit: validated.perUserLimit,
        applicableProductIds: validated.applicableProductIds,
        isActive: validated.isActive,
      },
      include: {
        brand: { select: { id: true, name: true } },
        _count: { select: { redemptions: true } },
      },
    });

    return NextResponse.json(serializePromoCode(promo), { status: 201 });
  } catch (err) {
    return handleApiError(err, "Failed to create promo code");
  }
}
