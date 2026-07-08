import { NextRequest, NextResponse } from "next/server";

import { z } from "zod";

import { handleApiError, requireAdmin } from "@/lib/api-utils";
import { normalizePromoCode } from "@/lib/checkout-pricing";
import { prisma } from "@/lib/generated/prisma";

const updatePromoCodeSchema = z.object({
  code: z.string().min(1).max(50).optional(),
  discountType: z.enum(["PERCENT", "FIXED"]).optional(),
  discountValue: z.number().positive().optional(),
  maxDiscountAmount: z.number().positive().nullable().optional(),
  startsAt: z.string().nullable().optional(),
  endsAt: z.string().nullable().optional(),
  usageLimit: z.number().int().positive().nullable().optional(),
  perUserLimit: z.number().int().positive().optional(),
  applicableProductIds: z.array(z.string().uuid()).optional(),
  isActive: z.boolean().optional(),
});

function parseOptionalDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const { id } = await params;
    const promo = await prisma.promoCode.findUnique({
      where: { id },
      include: {
        brand: { select: { id: true, name: true } },
        _count: { select: { redemptions: true } },
      },
    });

    if (!promo) return NextResponse.json({ error: "Promo code not found" }, { status: 404 });

    return NextResponse.json({
      ...promo,
      discountValue: Number(promo.discountValue),
      maxDiscountAmount: promo.maxDiscountAmount != null ? Number(promo.maxDiscountAmount) : null,
      startsAt: promo.startsAt?.toISOString() ?? null,
      endsAt: promo.endsAt?.toISOString() ?? null,
      createdAt: promo.createdAt.toISOString(),
      updatedAt: promo.updatedAt.toISOString(),
    });
  } catch (err) {
    return handleApiError(err, "Failed to fetch promo code");
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const { id } = await params;
    const existing = await prisma.promoCode.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Promo code not found" }, { status: 404 });

    const body = await request.json();
    const validated = updatePromoCodeSchema.parse(body);

    if (validated.code) {
      const code = normalizePromoCode(validated.code);
      const duplicate = await prisma.promoCode.findFirst({
        where: { brandId: existing.brandId, code, NOT: { id } },
      });
      if (duplicate) {
        return NextResponse.json({ error: "Promo code already exists for this brand" }, { status: 400 });
      }
    }

    const promo = await prisma.promoCode.update({
      where: { id },
      data: {
        ...(validated.code ? { code: normalizePromoCode(validated.code) } : {}),
        ...(validated.discountType ? { discountType: validated.discountType } : {}),
        ...(validated.discountValue != null ? { discountValue: validated.discountValue } : {}),
        ...(Object.prototype.hasOwnProperty.call(validated, "maxDiscountAmount")
          ? { maxDiscountAmount: validated.maxDiscountAmount ?? null }
          : {}),
        ...(Object.prototype.hasOwnProperty.call(validated, "startsAt")
          ? { startsAt: parseOptionalDate(validated.startsAt) }
          : {}),
        ...(Object.prototype.hasOwnProperty.call(validated, "endsAt")
          ? { endsAt: parseOptionalDate(validated.endsAt) }
          : {}),
        ...(Object.prototype.hasOwnProperty.call(validated, "usageLimit")
          ? { usageLimit: validated.usageLimit ?? null }
          : {}),
        ...(validated.perUserLimit != null ? { perUserLimit: validated.perUserLimit } : {}),
        ...(validated.applicableProductIds ? { applicableProductIds: validated.applicableProductIds } : {}),
        ...(validated.isActive != null ? { isActive: validated.isActive } : {}),
      },
      include: {
        brand: { select: { id: true, name: true } },
        _count: { select: { redemptions: true } },
      },
    });

    return NextResponse.json({
      ...promo,
      discountValue: Number(promo.discountValue),
      maxDiscountAmount: promo.maxDiscountAmount != null ? Number(promo.maxDiscountAmount) : null,
      startsAt: promo.startsAt?.toISOString() ?? null,
      endsAt: promo.endsAt?.toISOString() ?? null,
      createdAt: promo.createdAt.toISOString(),
      updatedAt: promo.updatedAt.toISOString(),
    });
  } catch (err) {
    return handleApiError(err, "Failed to update promo code");
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const { id } = await params;
    const existing = await prisma.promoCode.findUnique({
      where: { id },
      include: { _count: { select: { redemptions: true } } },
    });
    if (!existing) return NextResponse.json({ error: "Promo code not found" }, { status: 404 });

    if (existing._count.redemptions > 0) {
      await prisma.promoCode.update({
        where: { id },
        data: { isActive: false },
      });
      return NextResponse.json({ success: true, deactivated: true });
    }

    await prisma.promoCode.delete({ where: { id } });
    return NextResponse.json({ success: true, deactivated: false });
  } catch (err) {
    return handleApiError(err, "Failed to delete promo code");
  }
}
