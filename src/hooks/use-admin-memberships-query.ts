"use client";

import { useQuery } from "@tanstack/react-query";

import type { PurchaseRecencyFilterValue } from "@/app/(main)/dashboard/admin/memberships/_components/purchase-recency-filter";
import { Membership } from "@/app/(main)/dashboard/admin/memberships/_components/schema";

export interface AdminMembershipsQueryParams {
  purchaseRecency: PurchaseRecencyFilterValue;
  createdFrom: string;
  createdTo: string;
  productId: string;
}

export function useAdminMemberships({
  purchaseRecency,
  createdFrom,
  createdTo,
  productId,
}: AdminMembershipsQueryParams) {
  const hasCreatedRange = Boolean(createdFrom || createdTo);

  return useQuery<Membership[]>({
    queryKey: ["admin-memberships", purchaseRecency, createdFrom, createdTo, productId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (productId) params.set("productId", productId);
      if (hasCreatedRange) {
        if (createdFrom) params.set("createdFrom", createdFrom);
        if (createdTo) params.set("createdTo", createdTo);
      } else if (purchaseRecency !== "all") {
        params.set("purchaseRecency", purchaseRecency);
      }
      const qs = params.toString();
      const response = await fetch(`/api/admin/memberships${qs ? `?${qs}` : ""}`);
      if (!response.ok) {
        throw new Error("Failed to fetch memberships");
      }
      return response.json();
    },
  });
}
