"use client";

import { useCallback } from "react";

import { useQueryClient } from "@tanstack/react-query";

import { refreshMembershipEligibilityAfterPayment } from "@/lib/member-booking-cache";
import { useBrandStore } from "@/stores/brand/brand-provider";

export function useMemberBookingCache() {
  const activeBrandId = useBrandStore((state) => state.activeBrandId);
  const queryClient = useQueryClient();

  const refreshAfterPayment = useCallback(
    async (transactionId?: string) => {
      await refreshMembershipEligibilityAfterPayment(queryClient, activeBrandId, transactionId);
    },
    [queryClient, activeBrandId],
  );

  return { refreshAfterPayment };
}
