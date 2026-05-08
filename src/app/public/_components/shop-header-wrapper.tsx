"use client";

import dynamic from "next/dynamic";

import type { Session } from "next-auth";

const ShopHeader = dynamic(() => import("./shop-header").then((mod) => ({ default: mod.ShopHeader })), {
  ssr: false,
  loading: () => (
    <header className="border-b">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="bg-muted h-6 w-32 animate-pulse rounded" />
        <div className="bg-muted h-9 w-24 animate-pulse rounded" />
      </div>
    </header>
  ),
});

interface ShopHeaderWrapperProps {
  session: Session | null;
}

export function ShopHeaderWrapper({ session }: ShopHeaderWrapperProps) {
  return <ShopHeader session={session} />;
}
