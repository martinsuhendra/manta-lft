"use client";

import { RoleGuard } from "@/components/role-guard";
import { USER_ROLES } from "@/lib/types";

import { PromoCodesTable } from "./_components/promo-codes-table";

export default function PromoCodesPage() {
  return (
    <RoleGuard allowedRoles={[USER_ROLES.ADMIN, USER_ROLES.SUPERADMIN, USER_ROLES.DEVELOPER]}>
      <div className="@container/main flex flex-col gap-4 md:gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold tracking-tight">Promo codes</h1>
          <p className="text-muted-foreground text-sm">
            Create checkout promo codes scoped to a brand. Discounts stack on top of product sale prices.
          </p>
        </div>
        <PromoCodesTable />
      </div>
    </RoleGuard>
  );
}
