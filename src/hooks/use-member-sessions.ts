/* eslint-disable @typescript-eslint/no-unnecessary-condition, security/detect-object-injection */
"use client";

import { useMemo } from "react";

import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";

import { useBrandStore } from "@/stores/brand/brand-provider";

export interface MemberSessionFilters {
  startDate?: string;
  endDate?: string;
  itemId?: string;
}

export interface MemberSessionItem {
  id: string;
  name: string;
  duration: number;
  capacity: number;
  color: string | null;
}

export interface MemberSessionTeacher {
  id: string;
  name: string | null;
  email: string | null;
}

export interface MemberSession {
  id: string;
  itemId: string;
  teacherId: string | null;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  notes: string | null;
  item: MemberSessionItem;
  teacher: MemberSessionTeacher | null;
  spotsLeft: number;
  capacity: number;
}

export interface EligibleMembershipOption {
  id: string;
  product: { name: string };
  slotsRequired: number;
  remainingQuota: number | null;
  isEligible: true;
}

export interface SessionEligibility {
  canJoin: boolean;
  alreadyBooked?: boolean;
  bookingId?: string;
  canCancel?: boolean;
  cancelDeadline?: string;
  spotsLeft?: number;
  eligibleMemberships: EligibleMembershipOption[];
  reason?: string;
}

export interface MemberWaiver {
  waiver: {
    contentHtml: string;
    version: number;
    isActive: boolean;
  };
  hasAccepted: boolean;
  acceptedAt?: string | null;
  acceptedVersion?: number | null;
}

export function useMemberSessions(filters?: MemberSessionFilters) {
  const activeBrandId = useBrandStore((state) => state.activeBrandId);
  const params = new URLSearchParams();
  if (filters) {
    if (filters.startDate) params.set("startDate", filters.startDate);
    if (filters.endDate) params.set("endDate", filters.endDate);
    if (filters.itemId) params.set("itemId", filters.itemId);
  }

  return useQuery<MemberSession[]>({
    queryKey: ["member-sessions", activeBrandId, filters],
    queryFn: async () => {
      const { data } = await axios.get<MemberSession[]>("/api/public/sessions", { params });
      return data;
    },
    retry: false,
  });
}

export function useSessionEligibility(sessionId: string | null, enabled: boolean) {
  const activeBrandId = useBrandStore((state) => state.activeBrandId);
  return useQuery<SessionEligibility>({
    queryKey: ["session-eligibility", activeBrandId, sessionId],
    queryFn: async () => {
      if (!sessionId) throw new Error("No session ID");
      const { data } = await axios.get<SessionEligibility>(`/api/public/sessions/${sessionId}/eligibility`);
      return data;
    },
    enabled: enabled && !!sessionId,
    retry: false,
  });
}

export function useSessionEligibilityBatch(sessionIds: string[], enabled: boolean) {
  const activeBrandId = useBrandStore((state) => state.activeBrandId);
  const results = useQueries({
    queries: sessionIds.map((id) => ({
      queryKey: ["session-eligibility", activeBrandId, id] as const,
      queryFn: async () => {
        const { data } = await axios.get<SessionEligibility>(`/api/public/sessions/${id}/eligibility`);
        return data;
      },
      enabled: enabled && !!id,
      retry: false,
    })),
  });

  const bySessionId = useMemo(() => {
    const map: Record<string, SessionEligibility | undefined> = {};
    sessionIds.forEach((id, i) => {
      const r = results[i];
      map[id] = r?.data;
    });
    return map;
  }, [sessionIds, results]);

  const isLoading = results.some((r) => r.isLoading);
  const isError = results.some((r) => r.isError);

  return { bySessionId, isLoading, isError, results };
}

export function useMemberWaiver(enabled = true) {
  const activeBrandId = useBrandStore((state) => state.activeBrandId);
  return useQuery<MemberWaiver>({
    queryKey: ["member-waiver", activeBrandId],
    queryFn: async () => {
      const { data } = await axios.get<MemberWaiver>("/api/public/waiver");
      return data;
    },
    enabled,
    retry: false,
  });
}

export function useAcceptMemberWaiver() {
  const activeBrandId = useBrandStore((state) => state.activeBrandId);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (version: number) => {
      const { data } = await axios.post("/api/public/waiver/accept", { version });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["member-waiver", activeBrandId] });
      queryClient.invalidateQueries({ queryKey: ["session-eligibility", activeBrandId] });
      toast.success("Waiver accepted");
    },
    onError: (err: unknown) => {
      const msg =
        axios.isAxiosError(err) && err.response?.data?.error
          ? String(err.response.data.error)
          : "Failed to accept waiver";
      toast.error(msg);
    },
  });
}

export function useMemberBookSession() {
  const activeBrandId = useBrandStore((state) => state.activeBrandId);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ sessionId, membershipId }: { sessionId: string; membershipId: string }) => {
      const { data } = await axios.post(`/api/public/sessions/${sessionId}/book`, { membershipId });
      return data;
    },
    onSuccess: (_, { sessionId }) => {
      queryClient.invalidateQueries({ queryKey: ["member-sessions", activeBrandId] });
      queryClient.invalidateQueries({
        queryKey: ["session-eligibility", activeBrandId, sessionId],
      });
      queryClient.invalidateQueries({ queryKey: ["my-account", activeBrandId] });
      toast.success("You're booked!");
    },
    onError: (err: unknown) => {
      const msg =
        axios.isAxiosError(err) && err.response?.data?.error ? String(err.response.data.error) : "Failed to book";
      toast.error(msg);
    },
  });
}

export function useMemberCancelBooking() {
  const activeBrandId = useBrandStore((state) => state.activeBrandId);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bookingId: string) => {
      await axios.delete(`/api/public/bookings/${bookingId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["member-sessions", activeBrandId] });
      queryClient.invalidateQueries({ queryKey: ["session-eligibility", activeBrandId] });
      queryClient.invalidateQueries({ queryKey: ["my-account", activeBrandId] });
      toast.success("Booking cancelled");
    },
    onError: (err: unknown) => {
      const msg =
        axios.isAxiosError(err) && err.response?.data?.error
          ? String(err.response.data.error)
          : "Failed to cancel booking";
      toast.error(msg);
    },
  });
}
