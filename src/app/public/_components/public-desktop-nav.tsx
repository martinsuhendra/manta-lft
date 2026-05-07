import Link from "next/link";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { isNavItemActive, NAV_ITEMS } from "./public-nav";

interface PublicDesktopNavProps {
  pathname: string;
  activeHash: string;
  isTransparent: boolean;
}

export function PublicDesktopNav({ pathname, activeHash, isTransparent }: PublicDesktopNavProps) {
  return (
    <nav className="hidden items-center gap-1 lg:flex">
      {NAV_ITEMS.map((item) => (
        <Link key={item.href} href={item.href}>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "rounded-full px-4 transition-colors",
              isTransparent && "text-white hover:bg-white/10 hover:text-white",
              isNavItemActive(pathname, activeHash, item.href) &&
                (isTransparent
                  ? "bg-white/20 text-white hover:bg-white/25"
                  : "bg-primary/10 text-primary hover:bg-primary/20"),
            )}
          >
            {item.label}
          </Button>
        </Link>
      ))}
    </nav>
  );
}
