import type { NextRequest } from "next/server";

import type { Prisma } from "@prisma/client";
import { endOfDay, isValid, parse, startOfDay, subDays, subMonths, subYears } from "date-fns";
import { z } from "zod";

import { getMembershipWhereForBrandAccess } from "@/lib/api-utils";

const purchaseRecencySchema = z.enum(["all", "7d", "1m", "3m", "1y"]);
const isoDateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected yyyy-MM-dd");
const uuidSchema = z.string().uuid("Invalid UUID");

export type PurchaseRecency = z.infer<typeof purchaseRecencySchema>;

export interface MembershipListFilterParams {
  purchaseRecency: PurchaseRecency;
  createdFrom?: string;
  createdTo?: string;
  productId?: string;
}

export type MembershipListFilterError = { error: string; status: number };

function mergeWhereClauses(clauses: Prisma.MembershipWhereInput[]): Prisma.MembershipWhereInput {
  return clauses.length === 1 ? clauses[0] : { AND: clauses };
}

function getRecencyStartDate(recency: Exclude<PurchaseRecency, "all">): Date {
  const now = new Date();
  switch (recency) {
    case "7d":
      return subDays(now, 7);
    case "1m":
      return subMonths(now, 1);
    case "3m":
      return subMonths(now, 3);
    case "1y":
      return subYears(now, 1);
  }
}

export function parseMembershipListFilters(
  request: NextRequest,
): MembershipListFilterParams | MembershipListFilterError {
  const purchaseRecencyParam = request.nextUrl.searchParams.get("purchaseRecency") ?? "all";
  const purchaseRecency = purchaseRecencySchema.safeParse(purchaseRecencyParam);
  if (!purchaseRecency.success) {
    return { error: "Invalid purchaseRecency", status: 400 };
  }

  const createdFrom = request.nextUrl.searchParams.get("createdFrom")?.trim() || undefined;
  const createdTo = request.nextUrl.searchParams.get("createdTo")?.trim() || undefined;
  const productId = request.nextUrl.searchParams.get("productId")?.trim() || undefined;

  if (createdFrom !== undefined && !isoDateOnly.safeParse(createdFrom).success) {
    return { error: "Invalid createdFrom", status: 400 };
  }
  if (createdTo !== undefined && !isoDateOnly.safeParse(createdTo).success) {
    return { error: "Invalid createdTo", status: 400 };
  }
  if (productId !== undefined && !uuidSchema.safeParse(productId).success) {
    return { error: "Invalid productId", status: 400 };
  }

  return {
    purchaseRecency: purchaseRecency.data,
    createdFrom,
    createdTo,
    productId,
  };
}

export function buildMembershipListWhere(
  request: NextRequest,
  brandIds: string[] | null,
  filters: MembershipListFilterParams,
): Prisma.MembershipWhereInput | MembershipListFilterError {
  let whereCombined: Prisma.MembershipWhereInput = getMembershipWhereForBrandAccess(request, brandIds);

  if (filters.productId) {
    whereCombined = mergeWhereClauses([whereCombined, { productId: filters.productId }]);
  }

  const hasCreatedRange = filters.createdFrom !== undefined || filters.createdTo !== undefined;

  if (hasCreatedRange) {
    const createdAtFilter: Prisma.DateTimeFilter = {};
    if (filters.createdFrom) {
      const fromDate = parse(filters.createdFrom, "yyyy-MM-dd", new Date());
      if (!isValid(fromDate)) return { error: "Invalid createdFrom", status: 400 };
      createdAtFilter.gte = startOfDay(fromDate);
    }
    if (filters.createdTo) {
      const toDate = parse(filters.createdTo, "yyyy-MM-dd", new Date());
      if (!isValid(toDate)) return { error: "Invalid createdTo", status: 400 };
      createdAtFilter.lte = endOfDay(toDate);
    }
    if (createdAtFilter.gte && createdAtFilter.lte && createdAtFilter.gte > createdAtFilter.lte) {
      return { error: "createdFrom must be before or equal to createdTo", status: 400 };
    }

    whereCombined = mergeWhereClauses([whereCombined, { createdAt: createdAtFilter }]);
    return whereCombined;
  }

  if (filters.purchaseRecency !== "all") {
    whereCombined = mergeWhereClauses([
      whereCombined,
      { createdAt: { gte: getRecencyStartDate(filters.purchaseRecency) } },
    ]);
  }

  return whereCombined;
}
