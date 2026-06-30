"use client";

import { useState } from "react";

import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Session } from "next-auth";
import { signOut } from "next-auth/react";

import { TeacherViewToggle } from "@/components/teacher-view-toggle";
import { Button } from "@/components/ui/button";
import { APP_CONFIG } from "@/config/app-config";
import { cn } from "@/lib/utils";

import { PublicDesktopNav } from "./public-desktop-nav";
import { PublicMobileMenu } from "./public-mobile-menu";
import { ShopBrandSwitcher } from "./shop-brand-switcher";
import { SignUpDialog } from "./sign-up-dialog";
import { useHeaderScrollSpy } from "./use-header-scroll-spy";

const SignInDialog = dynamic(() => import("./sign-in-dialog").then((mod) => mod.SignInDialog), { ssr: false });

interface ShopHeaderProps {
  session: Session | null;
}

export function ShopHeader({ session }: ShopHeaderProps) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [signInOpen, setSignInOpen] = useState(false);
  const { activeHash, isScrolled } = useHeaderScrollSpy({ pathname });

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/public" });
  };

  return (
    <header
      className={cn(
        "fixed top-0 right-0 left-0 z-50 transition-all duration-300 ease-in-out",
        isScrolled
          ? "border-border/40 bg-brand-accent/80 border-b shadow-sm backdrop-blur-md"
          : "bg-brand-accent border-transparent",
      )}
    >
      <div className="container mx-auto flex items-center justify-between gap-3 px-4 py-5 sm:px-4 sm:py-6">
        <Link href="/public" className="group flex shrink-0 items-center gap-2">
          <div className="relative h-8 w-8 transition-transform group-hover:scale-110">
            <Image
              src="/manta-logo.jpg"
              alt="Manta logo"
              fill
              sizes="32px"
              priority
              className="rounded-full object-cover"
            />
          </div>
          <span className="text-base font-bold tracking-tight text-white transition-colors sm:text-xl">
            {APP_CONFIG.name}
          </span>
        </Link>

        <PublicDesktopNav pathname={pathname} activeHash={activeHash} />

        <nav className="hidden items-center justify-end gap-2 md:flex">
          {session ? (
            <>
              <TeacherViewToggle role={session.user.role} appearance="public" />
              <ShopBrandSwitcher />
              <Link href="/public/my-account">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white transition-colors hover:bg-white/10 hover:text-white"
                >
                  My Account
                </Button>
              </Link>
              <Button variant="secondary" size="sm" onClick={handleSignOut}>
                Sign Out
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="text-white transition-colors hover:bg-white/10 hover:text-white"
                onClick={() => setSignInOpen(true)}
              >
                Sign In
              </Button>
              <SignUpDialog>
                <Button size="sm" variant="default">
                  Sign Up
                </Button>
              </SignUpDialog>
            </>
          )}
        </nav>

        <PublicMobileMenu
          isOpen={isMobileMenuOpen}
          onOpenChange={setIsMobileMenuOpen}
          pathname={pathname}
          activeHash={activeHash}
          session={session}
          onSignIn={() => setSignInOpen(true)}
          onSignOut={handleSignOut}
        />

        {!session ? <SignInDialog open={signInOpen} onOpenChange={setSignInOpen} /> : null}
      </div>
    </header>
  );
}
