import { NextRequest, NextResponse } from "next/server";

import type { Prisma } from "@prisma/client";
import { endOfDay, isValid, parse, startOfDay, subDays, subMonths, subYears } from "date-fns";
import { getServerSession } from "next-auth/next";
import { z } from "zod";

import { authOptions } from "@/auth";
import { getMembershipWhereForBrandAccess, requireBrandAccess } from "@/lib/api-utils";
import { prisma } from "@/lib/generated/prisma";
import { USER_ROLES } from "@/lib/types";

const purchaseRecencySchema = z.enum(["all", "7d", "1m", "3m", "1y"]);

const isoDateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected yyyy-MM-dd");
const uuidSchema = z.string().uuid("Invalid UUID");

const createMembershipSchema = z.object({
  userId: z.string().uuid("Invalid user ID"),
  productId: z.string().uuid("Invalid product ID"),
  status: z.enum(["ACTIVE", "FREEZED", "EXPIRED", "SUSPENDED", "PENDING"]).default("ACTIVE"),
  joinDate: z.string().optional(),
});

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

    const purchaseRecencyParam = request.nextUrl.searchParams.get("purchaseRecency") ?? "all";
    const purchaseRecency = purchaseRecencySchema.safeParse(purchaseRecencyParam);
    if (!purchaseRecency.success) {
      return NextResponse.json({ error: "Invalid purchaseRecency" }, { status: 400 });
    }

    const createdFromParam = request.nextUrl.searchParams.get("createdFrom")?.trim() || undefined;
    const createdToParam = request.nextUrl.searchParams.get("createdTo")?.trim() || undefined;
    const productIdParam = request.nextUrl.searchParams.get("productId")?.trim() || undefined;

    if (createdFromParam !== undefined && !isoDateOnly.safeParse(createdFromParam).success) {
      return NextResponse.json({ error: "Invalid createdFrom" }, { status: 400 });
    }
    if (createdToParam !== undefined && !isoDateOnly.safeParse(createdToParam).success) {
      return NextResponse.json({ error: "Invalid createdTo" }, { status: 400 });
    }
    if (productIdParam !== undefined && !uuidSchema.safeParse(productIdParam).success) {
      return NextResponse.json({ error: "Invalid productId" }, { status: 400 });
    }

    const hasCreatedRange = createdFromParam !== undefined || createdToParam !== undefined;

    let whereCombined: Prisma.MembershipWhereInput = getMembershipWhereForBrandAccess(request, brandIds);
    if (productIdParam) {
      const clauses: Prisma.MembershipWhereInput[] = [];
      if (Object.keys(whereCombined).length > 0) clauses.push(whereCombined);
      clauses.push({ productId: productIdParam });
      whereCombined = clauses.length === 1 ? clauses[0] : { AND: clauses };
    }

    if (hasCreatedRange) {
      const createdAtFilter: Prisma.DateTimeFilter = {};
      if (createdFromParam) {
        const d = parse(createdFromParam, "yyyy-MM-dd", new Date());
        if (!isValid(d)) return NextResponse.json({ error: "Invalid createdFrom" }, { status: 400 });
        createdAtFilter.gte = startOfDay(d);
      }
      if (createdToParam) {
        const d = parse(createdToParam, "yyyy-MM-dd", new Date());
        if (!isValid(d)) return NextResponse.json({ error: "Invalid createdTo" }, { status: 400 });
        createdAtFilter.lte = endOfDay(d);
      }
      if (createdAtFilter.gte && createdAtFilter.lte && createdAtFilter.gte > createdAtFilter.lte) {
        return NextResponse.json({ error: "createdFrom must be before or equal to createdTo" }, { status: 400 });
      }

      const clauses: Prisma.MembershipWhereInput[] = [];
      if (Object.keys(whereCombined).length > 0) clauses.push(whereCombined);
      clauses.push({ createdAt: createdAtFilter });

      whereCombined = clauses.length === 1 ? clauses[0] : { AND: clauses };
    } else if (purchaseRecency.data !== "all") {
      const now = new Date();
      const periodStart =
        purchaseRecency.data === "7d"
          ? subDays(now, 7)
          : purchaseRecency.data === "1m"
            ? subMonths(now, 1)
            : purchaseRecency.data === "3m"
              ? subMonths(now, 3)
              : subYears(now, 1);

      const clauses: Prisma.MembershipWhereInput[] = [];
      if (Object.keys(whereCombined).length > 0) clauses.push(whereCombined);
      clauses.push({ createdAt: { gte: periodStart } });

      whereCombined = clauses.length === 1 ? clauses[0] : { AND: clauses };
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

    // Get product details to calculate expiration and quota
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

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: validatedData.userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Calculate expiration date from start date (joinDate) or current date
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
