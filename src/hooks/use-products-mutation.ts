"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios, { AxiosError } from "axios";
import { toast } from "sonner";

import { Product } from "@/app/(main)/dashboard/products/_components/schema";
import { CloudinaryAssetPayload } from "@/lib/cloudinary-asset";

export interface CreateProductData {
  brandIds: string[];
  name: string;
  description?: string;
  price: number;
  salePrice?: number | null;
  discountStartsAt?: string | null;
  discountEndsAt?: string | null;
  validDays: number;
  participantsPerPurchase?: number;
  isPurchaseUnlimited: boolean;
  purchaseLimitPerUser?: number | null;
  features: string[];
  image?: string;
  imageAsset?: CloudinaryAssetPayload | null;
  paymentUrl?: string;
  whatIsIncluded?: string;
  isActive: boolean;
  isPublic: boolean;
}

type UpdateProductData = Partial<CreateProductData>;

export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateProductData) => {
      const response = await axios.post("/api/products", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (error: AxiosError<{ error: string }>) => {
      toast.error(error.response?.data.error || "Failed to create product");
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateProductData }) => {
      const response = await axios.put(`/api/products/${id}`, data);
      return response.data;
    },
    onSuccess: (updated, { id }) => {
      queryClient.setQueriesData<Product[]>({ queryKey: ["products"] }, (old) => {
        if (!old) return old;
        return old.map((product) => (product.id === id ? { ...product, ...updated, _count: product._count } : product));
      });
    },
    onError: (error: AxiosError<{ error: string }>) => {
      toast.error(error.response?.data.error || "Failed to update product");
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await axios.delete(`/api/products/${id}`);
      return response.data;
    },
    onSuccess: () => {
      toast.success("Product deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (error: AxiosError<{ error: string }>) => {
      toast.error(error.response?.data.error || "Failed to delete product");
    },
  });
}

export function useReorderProducts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productIds: string[]) => {
      const response = await axios.patch("/api/products/reorder", { productIds });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (error: AxiosError<{ error: string }>) => {
      toast.error(error.response?.data.error || "Failed to reorder products");
    },
  });
}
