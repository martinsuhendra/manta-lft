"use client";

import { Clock, TrendingDown, TrendingUp, Wallet } from "lucide-react";

import { dashboardOverviewMock } from "@/app/(main)/dashboard/_shared/overview/overview.config";
import type { DashboardOverview } from "@/app/(main)/dashboard/_shared/overview/schema";
import { sectionCardsGradientGridClassName } from "@/app/(main)/dashboard/_shared/overview/section-cards";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { cn, formatPrice } from "@/lib/utils";

interface FinanceKpiCardsProps {
  data?: DashboardOverview;
}

const kpiGridClassName = cn(
  sectionCardsGradientGridClassName,
  "grid grid-cols-1 gap-4 *:min-w-0 sm:grid-cols-2 lg:grid-cols-4",
);

function DeltaBadge({ value }: { value: number }) {
  const isPositive = value >= 0;
  return (
    <StatusBadge variant="outline">
      {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {isPositive ? "+" : ""}
      {value}%
    </StatusBadge>
  );
}

export function FinanceKpiCards({ data = dashboardOverviewMock }: FinanceKpiCardsProps) {
  const { kpi, revenueSummary, quickStats } = data;

  return (
    <div className={kpiGridClassName}>
      <Card className="@container/card">
        <CardHeader className="pb-2">
          <div className="w-fit rounded-lg bg-green-500/10 p-2">
            <Wallet className="size-5 text-green-500" />
          </div>
        </CardHeader>
        <CardContent className="space-y-1">
          <CardTitle className="text-sm @[200px]/card:text-base">Revenue</CardTitle>
          <CardDescription>Completed sales this month</CardDescription>
          <p className="text-lg leading-tight font-semibold tabular-nums 2xl:text-2xl @[220px]/card:text-xl">
            {formatPrice(kpi.revenue.value)}
          </p>
          <DeltaBadge value={kpi.revenue.deltaPercent} />
        </CardContent>
        <CardFooter className="text-muted-foreground text-xs">Membership & product income</CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader className="pb-2">
          <div className="w-fit rounded-lg bg-blue-500/10 p-2">
            <TrendingUp className="size-5 text-blue-500" />
          </div>
        </CardHeader>
        <CardContent className="space-y-1">
          <CardTitle className="text-sm @[200px]/card:text-base">Income</CardTitle>
          <CardDescription>Recognized this period</CardDescription>
          <p className="text-2xl font-semibold tabular-nums">{formatPrice(revenueSummary.income)}</p>
        </CardContent>
        <CardFooter className="text-muted-foreground text-xs">After successful payments</CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader className="pb-2">
          <div className="bg-destructive/10 w-fit rounded-lg p-2">
            <TrendingDown className="text-destructive size-5" />
          </div>
        </CardHeader>
        <CardContent className="space-y-1">
          <CardTitle className="text-sm @[200px]/card:text-base">Refunds</CardTitle>
          <CardDescription>Processed this period</CardDescription>
          <p className="text-2xl font-semibold tabular-nums">{formatPrice(revenueSummary.refunds)}</p>
        </CardContent>
        <CardFooter className="text-muted-foreground text-xs">Membership reversals</CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader className="pb-2">
          <div className="w-fit rounded-lg bg-yellow-500/10 p-2">
            <Clock className="size-5 text-yellow-500" />
          </div>
        </CardHeader>
        <CardContent className="space-y-1">
          <CardTitle className="text-sm @[200px]/card:text-base">Pending</CardTitle>
          <CardDescription>Awaiting confirmation</CardDescription>
          <p className="text-2xl font-semibold tabular-nums">{formatPrice(revenueSummary.pending)}</p>
        </CardContent>
        <CardFooter className="text-muted-foreground text-xs">
          Payroll MTD {formatPrice(quickStats.payrollCostMtd)}
        </CardFooter>
      </Card>
    </div>
  );
}
