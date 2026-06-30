import Link from "next/link";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { isNavItemActive, NAV_ITEMS } from "./public-nav";

interface PublicDesktopNavProps {
  pathname: string;
  activeHash: string;
}

export function PublicDesktopNav({ pathname, activeHash }: PublicDesktopNavProps) {
  return (
    <nav className="hidden items-center gap-1 lg:flex">
      {NAV_ITEMS.map((item) => (
        <Link key={item.href} href={item.href}>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "rounded-full px-4 transition-colors",
              "text-white hover:bg-white/10 hover:text-white",
              isNavItemActive(pathname, activeHash, item.href) &&
                "bg-brand-primary hover:bg-brand-primary/90 text-white",
            )}
          >
            {item.label}
          </Button>
        </Link>
      ))}
    </nav>
  );
}
