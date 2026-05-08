import Link from "next/link";

import { LogIn, LogOut, Menu, User, UserPlus } from "lucide-react";
import type { Session } from "next-auth";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { APP_CONFIG } from "@/config/app-config";
import { cn } from "@/lib/utils";

import { isNavItemActive, NAV_ITEMS } from "./public-nav";
import { ShopBrandSwitcher } from "./shop-brand-switcher";
import { SignUpDialog } from "./sign-up-dialog";

interface PublicMobileMenuProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  isTransparent: boolean;
  pathname: string;
  activeHash: string;
  mounted: boolean;
  session: Session | null;
  onSignIn: () => void;
  onSignOut: () => Promise<void>;
}

export function PublicMobileMenu({
  isOpen,
  onOpenChange,
  isTransparent,
  pathname,
  activeHash,
  mounted,
  session,
  onSignIn,
  onSignOut,
}: PublicMobileMenuProps) {
  return (
    <div className="md:hidden">
      <Sheet open={isOpen} onOpenChange={onOpenChange}>
        <Button
          variant="ghost"
          size="icon"
          className={cn("transition-colors", isTransparent && "text-white hover:bg-white/10 hover:text-white")}
          onClick={() => onOpenChange(true)}
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Open menu</span>
        </Button>
        <SheetContent side="right" className="w-[88vw] max-w-sm">
          <SheetHeader>
            <SheetTitle>{APP_CONFIG.name}</SheetTitle>
            <SheetDescription>Navigate pages and manage your account</SheetDescription>
          </SheetHeader>

          <div className="space-y-6 px-4">
            <nav className="space-y-2">
              {NAV_ITEMS.map((item) => (
                <SheetClose asChild key={item.href}>
                  <Link href={item.href}>
                    <Button
                      variant={isNavItemActive(pathname, activeHash, item.href) ? "secondary" : "ghost"}
                      className="w-full justify-start rounded-lg text-base"
                    >
                      {item.label}
                    </Button>
                  </Link>
                </SheetClose>
              ))}
            </nav>

            {mounted && session ? (
              <div className="space-y-3">
                <ShopBrandSwitcher mobile />
                <SheetClose asChild>
                  <Link href="/public/my-account">
                    <Button variant="outline" className="w-full justify-start rounded-lg">
                      <User className="mr-2 h-4 w-4" />
                      My Account
                    </Button>
                  </Link>
                </SheetClose>
              </div>
            ) : null}
          </div>

          <SheetFooter className="mt-auto">
            {!mounted ? (
              <div className="space-y-2">
                <div className="bg-muted h-9 w-full animate-pulse rounded-md" />
                <div className="bg-muted h-9 w-full animate-pulse rounded-md" />
              </div>
            ) : session ? (
              <Button
                variant="outline"
                className="text-destructive border-destructive/20 hover:bg-destructive/10 hover:text-destructive w-full"
                onClick={async () => {
                  onOpenChange(false);
                  await onSignOut();
                }}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    onOpenChange(false);
                    onSignIn();
                  }}
                >
                  <LogIn className="mr-2 h-4 w-4" />
                  Sign In
                </Button>
                <SignUpDialog>
                  <Button
                    onClick={() => {
                      onOpenChange(false);
                    }}
                  >
                    <UserPlus className="mr-2 h-4 w-4" />
                    Sign Up
                  </Button>
                </SignUpDialog>
              </div>
            )}
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
