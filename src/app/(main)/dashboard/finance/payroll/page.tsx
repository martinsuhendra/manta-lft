/* eslint-disable complexity */
"use client";

import { useEffect, useMemo, useState } from "react";

import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { BookOpen, CalendarDays, Users, Wallet } from "lucide-react";
import { useSession } from "next-auth/react";

import { RoleGuard } from "@/components/role-guard";
import { Badge } from "@/components/ui/badge";
import { Card, CardAction, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RBAC_PAYROLL_MENU_ROLES } from "@/lib/rbac";
import { USER_ROLES } from "@/lib/types";
import { formatPrice } from "@/lib/utils";

import { SectionCardsGrid } from "../../_shared/overview/section-cards";

import { PayrollFilters, getSummaryQueryParams, type PayrollFiltersState } from "./_components/payroll-filters";
import { PayrollSummaryTable } from "./_components/payroll-summary-table";
import { TeacherFeesTable } from "./_components/teacher-fees-table";

export default function PayrollPage() {
  const { data: session } = useSession();
  const userRole = session?.user.role;
  const userId = session?.user.id;
  const isTeacher = userRole === USER_ROLES.TEACHER;
  const [filters, setFilters] = useState<PayrollFiltersState>({ period: "this-month" });

  useEffect(() => {
    if (userRole === USER_ROLES.TEACHER && userId) {
      setFilters((f) => ({ ...f, teacherId: userId }));
    }
  }, [userRole, userId]);

  const params = useMemo(() => getSummaryQueryParams(filters), [filters]);

  const lockedTeacherId = isTeacher && userId ? userId : undefined;

  const { data, isLoading } = useQuery({
    queryKey: ["payroll-summary", params],
    queryFn: async () => {
      const search = new URLSearchParams({
        startDate: params.startDate,
        endDate: params.endDate,
        status: "COMPLETED",
      });
      if (params.teacherId) search.set("teacherId", params.teacherId);
      if (params.itemId) search.set("itemId", params.itemId);
      const res = await fetch(`/api/admin/payroll/summary?${search}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error ?? "Failed to load summary");
      }
      return res.json();
    },
  });

  const totalTeachers = data?.rows?.length ?? 0;
  const totalSessions =
    data?.rows?.reduce((acc: number, row: { sessionsCount: number }) => acc + row.sessionsCount, 0) ?? 0;
  const grandTotal = data?.grandTotalFee ?? 0;

  const summarySection = (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge
          variant="secondary"
          className="text-muted-foreground flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-normal"
        >
          <CalendarDays className="h-3.5 w-3.5 opacity-70" />
          <span>
            {format(parseISO(params.startDate), "MMM d, yyyy")} – {format(parseISO(params.endDate), "MMM d, yyyy")}
          </span>
        </Badge>
        <PayrollFilters
          filters={filters}
          onFiltersChange={setFilters}
          hideTeacherFilter={isTeacher}
          hideItemFilter={isTeacher}
          lockedTeacherId={lockedTeacherId}
        />
      </div>

      {!isTeacher && (
        <SectionCardsGrid columns={3}>
          <Card className="@container/card">
            <CardHeader>
              <CardDescription>Total payroll</CardDescription>
              <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                {formatPrice(grandTotal)}
              </CardTitle>
              <CardAction>
                <StatusBadge variant="outline">
                  <Wallet className="size-4" />
                </StatusBadge>
              </CardAction>
            </CardHeader>
            <CardFooter className="flex-col items-start gap-1.5 text-sm">
              <div className="line-clamp-1 flex gap-2 font-medium">Gross IDR for the period</div>
              <div className="text-muted-foreground">Before tax or other deductions</div>
            </CardFooter>
          </Card>
          <Card className="@container/card">
            <CardHeader>
              <CardDescription>Teachers paid</CardDescription>
              <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                {totalTeachers}
              </CardTitle>
              <CardAction>
                <StatusBadge variant="outline">
                  <Users className="size-4" />
                </StatusBadge>
              </CardAction>
            </CardHeader>
            <CardFooter className="flex-col items-start gap-1.5 text-sm">
              <div className="line-clamp-1 flex gap-2 font-medium">With payroll in this view</div>
              <div className="text-muted-foreground">After teacher & class filters</div>
            </CardFooter>
          </Card>
          <Card className="@container/card">
            <CardHeader>
              <CardDescription>Completed sessions</CardDescription>
              <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                {totalSessions}
              </CardTitle>
              <CardAction>
                <StatusBadge variant="outline">
                  <BookOpen className="size-4" />
                </StatusBadge>
              </CardAction>
            </CardHeader>
            <CardFooter className="flex-col items-start gap-1.5 text-sm">
              <div className="line-clamp-1 flex gap-2 font-medium">Sessions counted toward fees</div>
              <div className="text-muted-foreground">Status: completed only</div>
            </CardFooter>
          </Card>
        </SectionCardsGrid>
      )}

      <PayrollSummaryTable rows={data?.rows ?? []} grandTotalFee={data?.grandTotalFee ?? 0} isLoading={isLoading} />
    </div>
  );

  return (
    <RoleGuard allowedRoles={[...RBAC_PAYROLL_MENU_ROLES]}>
      <div className="@container/main flex flex-col gap-4 md:gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold tracking-tight">Payroll</h1>
          <p className="text-muted-foreground text-sm">
            {isTeacher
              ? "Your completed sessions and fees (IDR) for the selected period. Read-only."
              : "View sessions taught by teacher and total fee to pay (IDR) for the selected period. Only completed sessions are counted. Amounts follow each teacher–class rule in Teacher fees (flat per session or per billable participant)."}
          </p>
        </div>

        <Tabs defaultValue="summary" className="w-full">
          <TabsList>
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="fees">Teacher fees</TabsTrigger>
          </TabsList>
          <TabsContent value="summary" className="mt-4">
            {summarySection}
          </TabsContent>
          <TabsContent value="fees" className="mt-4">
            <TeacherFeesTable teacherId={isTeacher ? userId : undefined} readOnly={isTeacher} />
          </TabsContent>
        </Tabs>
      </div>
    </RoleGuard>
  );
}
