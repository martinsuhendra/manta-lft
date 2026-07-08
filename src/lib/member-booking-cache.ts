import type { QueryClient } from "@tanstack/react-query";
import axios from "axios";

export function getMemberBookingQueryKeys(activeBrandId: string | null) {
  return {
    memberSessions: activeBrandId ? (["member-sessions", activeBrandId] as const) : (["member-sessions"] as const),
    sessionEligibility: activeBrandId
      ? (["session-eligibility", activeBrandId] as const)
      : (["session-eligibility"] as const),
    myAccount: activeBrandId ? (["my-account", activeBrandId] as const) : (["my-account"] as const),
  };
}

export async function invalidateMemberBookingQueries(queryClient: QueryClient, activeBrandId: string | null) {
  const keys = getMemberBookingQueryKeys(activeBrandId);
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: keys.memberSessions }),
    queryClient.invalidateQueries({ queryKey: keys.sessionEligibility }),
    queryClient.invalidateQueries({ queryKey: keys.myAccount }),
  ]);
}

export async function refreshMembershipEligibilityAfterPayment(
  queryClient: QueryClient,
  activeBrandId: string | null,
  transactionId?: string,
) {
  if (transactionId) {
    try {
      await axios.post(`/api/transactions/${transactionId}/sync`);
    } catch {
      // Webhook may still be processing; continue with cache refresh.
    }
  }

  const keys = getMemberBookingQueryKeys(activeBrandId);
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: keys.sessionEligibility }),
    queryClient.invalidateQueries({ queryKey: keys.memberSessions }),
    queryClient.invalidateQueries({ queryKey: keys.myAccount }),
  ]);
}
