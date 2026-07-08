"use client";

import { useQuery } from "@tanstack/react-query";

export interface PublicWaiver {
  contentHtml: string;
  version: number;
  isActive: boolean;
}

async function fetchPublicWaiver(): Promise<PublicWaiver> {
  const response = await fetch("/api/public/waiver");
  if (!response.ok) throw new Error("Failed to load waiver");

  const data = (await response.json()) as PublicWaiver | { waiver: PublicWaiver };
  return "waiver" in data ? data.waiver : data;
}

export function usePublicWaiver(enabled = true) {
  return useQuery({
    queryKey: ["public-waiver"],
    queryFn: fetchPublicWaiver,
    enabled,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}
