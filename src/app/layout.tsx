import { ReactNode } from "react";

import type { Metadata } from "next";
import { Outfit } from "next/font/google";

import { SpeedInsights } from "@vercel/speed-insights/next";

import { Providers } from "@/components/providers";
import { APP_CONFIG } from "@/config/app-config";

import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  display: "swap",
  preload: true,
  adjustFontFallback: true,
});

export const metadata: Metadata = {
  title: APP_CONFIG.meta.title,
  description: APP_CONFIG.meta.description,
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" data-theme-preset="manta" suppressHydrationWarning>
      <body className={`${outfit.className} min-h-screen antialiased`}>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (() => {
                try {
                  const path = window.location.pathname || ""
                  const isPublicShop = path === "/public" || path.startsWith("/public/")
                  if (isPublicShop) {
                    document.documentElement.classList.add("dark")
                    document.documentElement.style.colorScheme = "dark"
                    return
                  }
                  const savedTheme = window.localStorage.getItem("theme")
                  if (savedTheme) return
                  document.documentElement.classList.add("dark")
                } catch {
                  document.documentElement.classList.add("dark")
                }
              })()
            `,
          }}
        />
        <Providers>{children}</Providers>
        <SpeedInsights />
      </body>
    </html>
  );
}
