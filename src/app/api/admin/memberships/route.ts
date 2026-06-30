import { NextRequest, NextResponse } from "next/server";

import { getServerSession } from "next-auth/next";
import { z } from "zod";

import { authOptions } from "@/auth";
import { requireBrandAccess } from "@/lib/api-utils";
import { prisma } from "@/lib/generated/prisma";
import {
  buildMembershipListWhere,
  parseMembershipListFilters,
  type MembershipListFilterError,
} from "@/lib/memberships/list-filters";
import { USER_ROLES } from "@/lib/types";

const createMembershipSchema = z.object({
  userId: z.string().uuid("Invalid user ID"),
  productId: z.string().uuid("Invalid product ID"),
  status: z.enum(["ACTIVE", "FREEZED", "EXPIRED", "SUSPENDED", "PENDING"]).default("ACTIVE"),
  joinDate: z.string().optional(),
});

function isFilterError(value: unknown): value is MembershipListFilterError {
  return typeof value === "object" && value !== null && "error" in value && "status" in value;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (![USER_ROLES.ADMIN, USER_ROLES.SUPERADMIN, USER_ROLES.DEVELOPER].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { error, brandIds } = await requireBrandAccess(request);
    if (error) return error;

    const parsedFilters = parseMembershipListFilters(request);
    if (isFilterError(parsedFilters)) {
      return NextResponse.json({ error: parsedFilters.error }, { status: parsedFilters.status });
    }

    const whereCombined = buildMembershipListWhere(request, brandIds, parsedFilters);
    if (isFilterError(whereCombined)) {
      return NextResponse.json({ error: whereCombined.error }, { status: whereCombined.status });
    }

    const memberships = await prisma.membership.findMany({
      where: whereCombined,
      include: {
        membershipBrands: {
          select: {
            brandId: true,
            brand: { select: { id: true, name: true } },
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phoneNo: true,
          },
        },
        product: {
          select: {
            id: true,
            name: true,
            price: true,
            validDays: true,
          },
        },
        transaction: {
          select: {
            id: true,
            status: true,
            amount: true,
            paidAt: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(
      memberships.map((membership) => ({
        ...membership,
        brandIds: membership.membershipBrands.map((mb) => mb.brandId),
        brands: membership.membershipBrands.map((mb) => mb.brand),
      })),
    );
  } catch (error) {
    console.error("Error fetching memberships:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (![USER_ROLES.ADMIN, USER_ROLES.SUPERADMIN, USER_ROLES.DEVELOPER].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = createMembershipSchema.parse(body);

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

    const productBrandIds = product.productBrands.map((pb) => pb.brandId);
    if (!productBrandIds.length) {
      return NextResponse.json({ error: "Product is not linked to any brand" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: validatedData.userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const startDate = validatedData.joinDate ? new Date(validatedData.joinDate) : new Date();
    const expiredAt = new Date(startDate);
    expiredAt.setDate(expiredAt.getDate() + product.validDays);

    const membership = await prisma.membership.create({
      data: {
        userId: validatedData.userId,
        productId: validatedData.productId,
        status: validatedData.status,
        joinDate: validatedData.joinDate ? new Date(validatedData.joinDate) : undefined,
        expiredAt,
        membershipBrands: {
          create: productBrandIds.map((brandId) => ({ brandId })),
        },
      },
      include: {
        membershipBrands: {
          select: {
            brandId: true,
            brand: { select: { id: true, name: true } },
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phoneNo: true,
          },
        },
        product: {
          select: {
            id: true,
            name: true,
            price: true,
            validDays: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        ...membership,
        brandIds: membership.membershipBrands.map((mb) => mb.brandId),
        brands: membership.membershipBrands.map((mb) => mb.brand),
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.errors }, { status: 400 });
    }

    console.error("Error creating membership:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
