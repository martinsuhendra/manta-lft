"use client";

import { useState } from "react";

import { usePathname } from "next/navigation";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { AuthProvider } from "@/components/auth-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";

function isPublicShopPath(pathname: string | null) {
  if (!pathname) return false;
  return pathname === "/public" || pathname.startsWith("/public/");
}

function AppThemeProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const forcedTheme = isPublicShopPath(pathname) ? "light" : undefined;

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      disableTransitionOnChange
      forcedTheme={forcedTheme}
    >
      {children}
    </ThemeProvider>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5, // 5 minutes
            retry: 1,
          },
        },
      }),
  );

  return (
    <AppThemeProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>{children}</AuthProvider>
        <Toaster richColors />
      </QueryClientProvider>
    </AppThemeProvider>
  );
}
