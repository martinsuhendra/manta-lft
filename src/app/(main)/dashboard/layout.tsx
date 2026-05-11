import { ReactNode } from "react";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { AppSidebar } from "@/app/(main)/dashboard/_components/sidebar/app-sidebar";
import { auth } from "@/auth";
import { ModeToggle } from "@/components/mode-toggle";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { USER_ROLES } from "@/lib/types";
import { cn } from "@/lib/utils";
import { getAccessibleBrandSummariesForUser } from "@/server/brands/get-accessible-brand-summaries";
import { getPreference } from "@/server/server-actions";
import {
  SIDEBAR_VARIANT_VALUES,
  SIDEBAR_COLLAPSIBLE_VALUES,
  CONTENT_LAYOUT_VALUES,
  type SidebarVariant,
  type SidebarCollapsible,
  type ContentLayout,
} from "@/types/preferences/layout";

import { BrandProviderWrapper } from "./_components/brand-provider-wrapper";
import { BrandThemeInjector } from "./_components/brand-theme-injector";
import { AccountSwitcher } from "./_components/sidebar/account-switcher";
import { SearchDialog } from "./_components/sidebar/search-dialog";

export default async function Layout({ children }: Readonly<{ children: ReactNode }>) {
  const session = await auth();

  if (!session) {
    redirect("/sign-in");
  }

  if (session.user.role === USER_ROLES.MEMBER) {
    redirect("/public");
  }

  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar_state")?.value === "true";

  const accessibleBrands = await getAccessibleBrandSummariesForUser({
    userId: session.user.id,
    role: session.user.role,
  });
  const allowedBrandIds = new Set(accessibleBrands.map((b) => b.id));
  const fallbackBrandId = accessibleBrands.length > 0 ? accessibleBrands[0].id : "ALL";

  const cookieBrand = cookieStore.get("active_brand_id")?.value;

  let activeBrandId: string | "ALL";
  if (cookieBrand === undefined || cookieBrand === "") {
    activeBrandId = fallbackBrandId;
  } else if (cookieBrand === "ALL") {
    activeBrandId = "ALL";
  } else if (allowedBrandIds.has(cookieBrand)) {
    activeBrandId = cookieBrand;
  } else {
    activeBrandId = fallbackBrandId;
  }

  const [sidebarVariant, sidebarCollapsible, contentLayout] = await Promise.all([
    getPreference<SidebarVariant>("sidebar_variant", SIDEBAR_VARIANT_VALUES, "inset"),
    getPreference<SidebarCollapsible>("sidebar_collapsible", SIDEBAR_COLLAPSIBLE_VALUES, "icon"),
    getPreference<ContentLayout>("content_layout", CONTENT_LAYOUT_VALUES, "centered"),
  ]);

  const currentUser = {
    name: session.user.name ?? "Unknown User",
    email: session.user.email ?? "",
    avatar: session.user.image ?? "",
  };

  return (
    <BrandProviderWrapper initialActiveBrandId={activeBrandId}>
      <BrandThemeInjector />
      <SidebarProvider defaultOpen={defaultOpen}>
        <AppSidebar user={currentUser} variant={sidebarVariant} collapsible={sidebarCollapsible} />
        <SidebarInset
          data-content-layout={contentLayout}
          className={cn(
            "data-[content-layout=centered]:mx-auto data-[content-layout=centered]:max-w-full",
            "data-[content-layout=full]:max-w-none",
            // Fix gap issue while maintaining proper width constraints
            "peer-data-[variant=inset]:ml-0 peer-data-[variant=inset]:peer-data-[state=collapsed]:ml-0",
            "w-full min-w-0 flex-1",
          )}
        >
          <header className="flex h-12 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
            <div className="flex w-full items-center justify-between px-4 lg:px-6">
              <div className="flex items-center gap-1 lg:gap-2">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="mx-2 data-[orientation=vertical]:h-4" />
                <SearchDialog />
              </div>
              <div className="flex items-center gap-2">
                <ModeToggle />
                <AccountSwitcher users={[currentUser]} />
              </div>
            </div>
          </header>
          <div className="h-full w-full px-4 py-4 md:px-6 md:py-6">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </BrandProviderWrapper>
  );
}
