import Link from "next/link";

import { LayoutDashboard, Store } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DASHBOARD_HOME_PATH, PUBLIC_HOME_PATH } from "@/lib/auth-session";
import { isTeacherRole } from "@/lib/rbac";
import { cn } from "@/lib/utils";

interface TeacherViewToggleProps {
  role: string | undefined;
  appearance?: "public" | "dashboard";
  className?: string;
}

export function TeacherViewToggle({ role, appearance = "dashboard", className }: TeacherViewToggleProps) {
  if (!isTeacherRole(role)) return null;

  const isPublicAppearance = appearance === "public";

  if (isPublicAppearance) {
    return (
      <Button asChild size="sm" variant="secondary" className={cn("gap-1.5 font-semibold", className)}>
        <Link href={DASHBOARD_HOME_PATH}>
          <LayoutDashboard className="h-4 w-4" />
          <span className="hidden sm:inline">Dashboard</span>
        </Link>
      </Button>
    );
  }

  return (
    <Button asChild size="sm" variant="outline" className={cn("gap-1.5 font-semibold", className)}>
      <Link href={PUBLIC_HOME_PATH}>
        <Store className="h-4 w-4" />
        <span className="hidden sm:inline">Public Site</span>
      </Link>
    </Button>
  );
}
