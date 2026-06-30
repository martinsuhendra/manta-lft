"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios, { AxiosError } from "axios";
import { toast } from "sonner";

import { CloudinaryAssetPayload } from "@/lib/cloudinary-asset";

import type { BrandAdmin } from "./use-brands-query";

interface CreateBrandInput {
  name: string;
  slug: string;
  address?: string;
  logo?: string;
  logoAsset?: CloudinaryAssetPayload | null;
  primaryColor?: string;
  accentColor?: string;
  isActive?: boolean;
}

type UpdateBrandInput = Partial<Omit<CreateBrandInput, "address" | "logo">> & {
  address?: string | null;
  logo?: string | null;
  logoAsset?: CloudinaryAssetPayload | null;
};

interface DeleteBrandErrorPayload {
  error?: string;
  reasons?: string[];
}

export function useCreateBrand() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateBrandInput) => {
      const res = await axios.post<BrandAdmin>("/api/admin/brands", data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brands"] });
      toast.success("Brand created");
    },
    onError: (err: AxiosError<{ error?: string }>) => {
      toast.error(err.response?.data.error ?? "Failed to create brand");
    },
  });
}

export function useUpdateBrand(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: UpdateBrandInput) => {
      const res = await axios.patch<BrandAdmin>(`/api/admin/brands/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brands"] });
      toast.success("Brand updated");
    },
    onError: (err: AxiosError<{ error?: string }>) => {
      toast.error(err.response?.data.error ?? "Failed to update brand");
    },
  });
}

export function useDeleteBrand() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!id.trim()) throw new Error("Brand id is required");
      await axios.delete(`/api/admin/brands/${encodeURIComponent(id)}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brands"] });
      toast.success("Brand deleted");
    },
    onError: (err: AxiosError<DeleteBrandErrorPayload>) => {
      const reasons = err.response?.data.reasons ?? [];
      if (reasons.length > 0) {
        const [firstReason, ...rest] = reasons;
        toast.error(rest.length > 0 ? `${firstReason} (+${rest.length} more)` : firstReason);
        return;
      }
      toast.error(err.response?.data.error ?? "Failed to delete brand");
    },
  });
}
