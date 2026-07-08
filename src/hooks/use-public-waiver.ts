"use client";

import { useQuery } from "@tanstack/react-query";

export interface PublicWaiver {
  id: string;
  name: string;
  contentHtml: string;
  version: number;
  isActive: boolean;
}

export interface PublicWaiversResponse {
  waivers: PublicWaiver[];
}

async function fetchPublicWaivers(): Promise<PublicWaiversResponse> {
  const response = await fetch("/api/public/waiver");
  if (!response.ok) throw new Error("Failed to load waivers");

  const data = await response.json();
  if (Array.isArray(data.waivers)) {
    return { waivers: data.waivers };
  }

  if ("waiver" in data && data.waiver) {
    return { waivers: [data.waiver as PublicWaiver] };
  }

  if ("contentHtml" in data) {
    return {
      waivers: [
        {
          id: "legacy",
          name: "Waiver",
          contentHtml: data.contentHtml,
          version: data.version,
          isActive: data.isActive,
        },
      ],
    };
  }

  return { waivers: [] };
}

export function usePublicWaiver(enabled = true) {
  return useQuery({
    queryKey: ["public-waivers"],
    queryFn: fetchPublicWaivers,
    enabled,
    staleTime: 5 * 60 * 1000,
    retry: false,
    select: (data) => ({
      waivers: data.waivers,
      hasActiveWaivers: data.waivers.some((waiver) => waiver.isActive),
    }),
  });
}
