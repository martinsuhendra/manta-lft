/* eslint-disable complexity */
import { NextRequest, NextResponse } from "next/server";

import { z } from "zod";

import { resolveActiveBrandIdFromCookie } from "@/lib/brand-cookie";
import { prisma } from "@/lib/generated/prisma";
import {
  createSnapTransaction,
  MEMBERSHIP_STATUS,
  SUSPENDED_TRANSACTION_STATUSES,
  TRANSACTION_STATUS,
  type TransactionMetadata,
} from "@/lib/midtrans";
import { buildTransactionPricingData, recordPromoRedemption, resolvePurchasePricing } from "@/lib/purchase-pricing";
import { DEFAULT_USER_ROLE } from "@/lib/types";

const purchaseSchema = z.object({
  productId: z.string().uuid("Invalid product ID"),
  customerEmail: z.string().email("Invalid email address"),
  customerName: z.string().min(1, "Name is required").optional(),
  promoCode: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = purchaseSchema.parse(body);

    const product = await prisma.product.findUnique({
      where: { id: validatedData.productId },
      include: {
        productBrands: {
          select: { brandId: true },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
    const productWithPurchaseLimit = product as typeof product & {
      isPurchaseUnlimited?: boolean;
      purchaseLimitPerUser?: number | null;
    };
    if (!product.isActive || !product.isPublic) {
      return NextResponse.json({ error: "Product is not available" }, { status: 400 });
    }
    const productBrandIds = product.productBrands.map((pb) => pb.brandId);
    if (!productBrandIds.length) {
      return NextResponse.json({ error: "Product is not linked to any brand" }, { status: 400 });
    }
    const cookieBrandId = await resolveActiveBrandIdFromCookie();
    const primaryBrandId =
      cookieBrandId && productBrandIds.includes(cookieBrandId) ? cookieBrandId : productBrandIds[0];

    let user = await prisma.user.findUnique({
      where: { email: validatedData.customerEmail },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: validatedData.customerEmail,
          name: validatedData.customerName || validatedData.customerEmail.split("@")[0],
          role: DEFAULT_USER_ROLE,
        },
      });
    }

    if (!productWithPurchaseLimit.isPurchaseUnlimited) {
      const purchaseCount = await prisma.transaction.count({
        where: {
          userId: user.id,
          productId: product.id,
          status: {
            notIn: SUSPENDED_TRANSACTION_STATUSES,
          },
        },
      });
      if (purchaseCount >= (productWithPurchaseLimit.purchaseLimitPerUser ?? 0)) {
        return NextResponse.json({ error: "Purchase limit reached for this product" }, { status: 400 });
      }
    }

    let pricing;
    try {
      pricing = await resolvePurchasePricing({
        product,
        productId: validatedData.productId,
        brandId: primaryBrandId,
        userId: user.id,
        promoCode: validatedData.promoCode,
      });
    } catch (error) {
      return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid pricing" }, { status: 400 });
    }

    const isFreePurchase = pricing.finalAmount === 0;
    const pricingData = buildTransactionPricingData(pricing);

    const { transaction, membership } = await prisma.$transaction(async (tx) => {
      const createdTransaction = await tx.transaction.create({
        data: {
          userId: user.id,
          productId: validatedData.productId,
          brandId: primaryBrandId,
          currency: "IDR",
          status: isFreePurchase ? TRANSACTION_STATUS.COMPLETED : TRANSACTION_STATUS.PENDING,
          paymentProvider: isFreePurchase ? "none" : "midtrans",
          paymentMethod: isFreePurchase ? "FREE_TRIAL" : null,
          paidAt: isFreePurchase ? new Date() : null,
          amount: pricingData.amount,
          listPrice: pricingData.listPrice,
          productDiscountAmount: pricingData.productDiscountAmount,
          promoDiscountAmount: pricingData.promoDiscountAmount,
          promoCode: pricingData.promoCode,
          promoCodeId: pricingData.promoCodeId,
          metadata: {
            customerEmail: validatedData.customerEmail,
            customerName: validatedData.customerName || user.name,
          },
        },
      });

      if (pricingData.promoCodeId && pricing.promoDiscountAmount > 0) {
        await recordPromoRedemption({
          tx,
          promoCodeId: pricingData.promoCodeId,
          userId: user.id,
          transactionId: createdTransaction.id,
          discountAmount: pricing.promoDiscountAmount,
        });
      }

      const expiredAt = new Date();
      expiredAt.setDate(expiredAt.getDate() + product.validDays);

      const createdMembership = await tx.membership.create({
        data: {
          userId: user.id,
          productId: validatedData.productId,
          expiredAt,
          transactionId: createdTransaction.id,
          status: isFreePurchase ? MEMBERSHIP_STATUS.ACTIVE : MEMBERSHIP_STATUS.PENDING,
          membershipBrands: {
            create: productBrandIds.map((brandId) => ({ brandId })),
          },
        },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              price: true,
              validDays: true,
              paymentUrl: true,
            },
          },
          membershipBrands: {
            select: {
              brandId: true,
              brand: { select: { id: true, name: true } },
            },
          },
        },
      });

      return { transaction: createdTransaction, membership: createdMembership };
    });

    if (isFreePurchase) {
      return NextResponse.json(
        {
          success: true,
          isFreePurchase: true,
          snapToken: null,
          transaction: {
            id: transaction.id,
            status: transaction.status,
            amount: Number(transaction.amount),
            currency: transaction.currency,
          },
          membership: {
            id: membership.id,
            status: membership.status,
            expiredAt: membership.expiredAt,
            product: membership.product,
            brandIds: membership.membershipBrands.map((mb) => mb.brandId),
            brands: membership.membershipBrands.map((mb) => mb.brand),
          },
        },
        { status: 201 },
      );
    }

    let snapToken: string | null = null;
    try {
      const snapResponse = await createSnapTransaction({
        transactionId: transaction.id,
        amount: Number(transaction.amount),
        customerName: validatedData.customerName || user.name || "Customer",
        customerEmail: validatedData.customerEmail,
        customerPhone: user.phoneNo || undefined,
        productId: validatedData.productId,
        productName: product.name,
      });

      snapToken = snapResponse.token;

      const updatedMetadata: TransactionMetadata = {
        ...(transaction.metadata as TransactionMetadata),
        snapToken: snapResponse.token,
        snapTokenCreatedAt: new Date().toISOString(),
      };

      await prisma.transaction.update({
        where: { id: transaction.id },
        data: { metadata: JSON.parse(JSON.stringify(updatedMetadata)) },
      });
    } catch (error) {
      console.error("Failed to create Snap token:", error);
      return NextResponse.json(
        {
          error: "Failed to initialize payment gateway",
          details: error instanceof Error ? error.message : "Unknown error",
          transaction: {
            id: transaction.id,
            status: transaction.status,
          },
        },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        isFreePurchase: false,
        snapToken,
        transaction: {
          id: transaction.id,
          status: transaction.status,
          amount: Number(transaction.amount),
          currency: transaction.currency,
        },
        membership: {
          id: membership.id,
          status: membership.status,
          expiredAt: membership.expiredAt,
          product: membership.product,
          brandIds: membership.membershipBrands.map((mb) => mb.brandId),
          brands: membership.membershipBrands.map((mb) => mb.brand),
        },
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.errors }, { status: 400 });
    }

    console.error("Failed to process purchase:", error);
    return NextResponse.json({ error: "Failed to process purchase" }, { status: 500 });
  }
}
