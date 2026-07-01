"use client";

import { Clock } from "lucide-react";

import { dashboardOverviewMock } from "@/app/(main)/dashboard/_shared/overview/overview.config";
import type { DashboardOverview } from "@/app/(main)/dashboard/_shared/overview/schema";
import { SectionCardsGrid } from "@/app/(main)/dashboard/_shared/overview/section-cards";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPrice } from "@/lib/utils";

interface FinanceQuickStatsProps {
  data?: DashboardOverview;
}

export function FinanceQuickStats({ data = dashboardOverviewMock }: FinanceQuickStatsProps) {
  const { quickStats } = data;

  return (
    <SectionCardsGrid columns={1}>
      <Card className="@container/card">
        <CardHeader>
          <div className="bg-primary/10 w-fit rounded-lg p-2">
            <Clock className="text-primary size-5" />
          </div>
          <CardTitle className="text-base">Payroll Cost MTD</CardTitle>
          <CardDescription>Teacher fees this month</CardDescription>
        </CardHeader>
        <CardFooter>
          <p className="text-2xl font-semibold tabular-nums">{formatPrice(quickStats.payrollCostMtd)}</p>
        </CardFooter>
      </Card>
    </SectionCardsGrid>
  );
}
