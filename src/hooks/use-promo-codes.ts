"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios, { AxiosError } from "axios";
import { toast } from "sonner";

export interface PromoCode {
  id: string;
  code: string;
  brandId: string;
  brand?: { id: string; name: string };
  discountType: "PERCENT" | "FIXED";
  discountValue: number;
  maxDiscountAmount: number | null;
  startsAt: string | null;
  endsAt: string | null;
  usageLimit: number | null;
  usageCount: number;
  perUserLimit: number;
  applicableProductIds: string[];
  isActive: boolean;
  redemptionCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface PromoCodeFormData {
  code: string;
  brandId: string;
  discountType: "PERCENT" | "FIXED";
  discountValue: number;
  maxDiscountAmount?: number | null;
  startsAt?: string | null;
  endsAt?: string | null;
  usageLimit?: number | null;
  perUserLimit?: number;
  applicableProductIds?: string[];
  isActive?: boolean;
}

export function usePromoCodes() {
  return useQuery<PromoCode[]>({
    queryKey: ["promo-codes"],
    queryFn: async () => {
      const response = await axios.get("/api/admin/promo-codes");
      return response.data;
    },
  });
}

export function useCreatePromoCode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: PromoCodeFormData) => {
      const response = await axios.post("/api/admin/promo-codes", data);
      return response.data;
    },
    onSuccess: () => {
      toast.success("Promo code created");
      queryClient.invalidateQueries({ queryKey: ["promo-codes"] });
    },
    onError: (error: AxiosError<{ error: string }>) => {
      toast.error(error.response?.data.error || "Failed to create promo code");
    },
  });
}

export function useUpdatePromoCode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<PromoCodeFormData> }) => {
      const response = await axios.put(`/api/admin/promo-codes/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      toast.success("Promo code updated");
      queryClient.invalidateQueries({ queryKey: ["promo-codes"] });
    },
    onError: (error: AxiosError<{ error: string }>) => {
      toast.error(error.response?.data.error || "Failed to update promo code");
    },
  });
}

export function useDeletePromoCode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await axios.delete(`/api/admin/promo-codes/${id}`);
      return response.data as { success: boolean; deactivated: boolean };
    },
    onSuccess: (data) => {
      toast.success(data.deactivated ? "Promo code deactivated" : "Promo code deleted");
      queryClient.invalidateQueries({ queryKey: ["promo-codes"] });
    },
    onError: (error: AxiosError<{ error: string }>) => {
      toast.error(error.response?.data.error || "Failed to delete promo code");
    },
  });
}
