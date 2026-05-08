"use client";

import { useEffect, useState } from "react";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Session } from "next-auth";
import { signOut } from "next-auth/react";

import { Button } from "@/components/ui/button";
import { APP_CONFIG } from "@/config/app-config";
import { cn } from "@/lib/utils";

import { PublicDesktopNav } from "./public-desktop-nav";
import { PublicMobileMenu } from "./public-mobile-menu";
import { ShopBrandSwitcher } from "./shop-brand-switcher";
import { SignInDialog } from "./sign-in-dialog";
import { SignUpDialog } from "./sign-up-dialog";
import { useHeaderScrollSpy } from "./use-header-scroll-spy";

interface ShopHeaderProps {
  session: Session | null;
}

export function ShopHeader({ session }: ShopHeaderProps) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [signInOpen, setSignInOpen] = useState(false);
  const { activeHash, isScrolled } = useHeaderScrollSpy({ pathname });

  // Pages that start with a dark section where we want transparent header
  const isDarkHeroPage = pathname === "/public";

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/public" });
  };

  const isTransparent = isDarkHeroPage && !isScrolled;

  return (
    <header
      className={cn(
        "fixed top-0 right-0 left-0 z-50 transition-all duration-300 ease-in-out",
        isScrolled
          ? "border-border/40 bg-background/80 border-b shadow-sm backdrop-blur-md"
          : isDarkHeroPage
            ? "border-transparent bg-transparent"
            : "bg-background/80 border-border/40 border-b backdrop-blur-md",
      )}
    >
      <div className="container mx-auto flex items-center justify-between gap-3 px-4 py-5 sm:px-4 sm:py-6">
        <Link href="/public" className="group flex shrink-0 items-center gap-2">
          <div className="relative h-8 w-8 transition-transform group-hover:scale-110">
            <Image src="/manta-logo.jpg" alt="Manta logo" fill sizes="32px" priority />
          </div>
          <span
            className={cn(
              "text-base font-bold tracking-tight transition-colors sm:text-xl",
              isTransparent && "text-white",
            )}
          >
            {APP_CONFIG.name}
          </span>
        </Link>

        <PublicDesktopNav pathname={pathname} activeHash={activeHash} isTransparent={isTransparent} />

        <nav className="hidden items-center justify-end gap-2 md:flex">
          {!mounted ? (
            <div className="bg-muted h-9 w-24 animate-pulse rounded-md" />
          ) : session ? (
            <>
              <ShopBrandSwitcher />
              <Link href="/public/my-account">
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn("transition-colors", isTransparent && "text-white hover:bg-white/10 hover:text-white")}
                >
                  My Account
                </Button>
              </Link>
              <Button variant={isTransparent ? "secondary" : "outline"} size="sm" onClick={handleSignOut}>
                Sign Out
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                className={cn("transition-colors", isTransparent && "text-white hover:bg-white/10 hover:text-white")}
                onClick={() => setSignInOpen(true)}
              >
                Sign In
              </Button>
              <SignUpDialog>
                <Button size="sm" variant={isTransparent ? "secondary" : "default"}>
                  Sign Up
                </Button>
              </SignUpDialog>
            </>
          )}
        </nav>

        <PublicMobileMenu
          isOpen={isMobileMenuOpen}
          onOpenChange={setIsMobileMenuOpen}
          isTransparent={isTransparent}
          pathname={pathname}
          activeHash={activeHash}
          mounted={mounted}
          session={session}
          onSignIn={() => setSignInOpen(true)}
          onSignOut={handleSignOut}
        />

        <SignInDialog open={signInOpen} onOpenChange={setSignInOpen} />
      </div>
    </header>
  );
}
