"use client";

import Link from "next/link";

import { AlertTriangle, ArrowRight, TrendingDown, TrendingUp, Users, Wallet } from "lucide-react";

import { dashboardOverviewMock } from "@/app/(main)/dashboard/_shared/overview/overview.config";
import type { DashboardOverview } from "@/app/(main)/dashboard/_shared/overview/schema";
import { sectionCardsGradientGridClassName } from "@/app/(main)/dashboard/_shared/overview/section-cards";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { cn, formatPrice } from "@/lib/utils";

interface HomeSummaryCardsProps {
  data?: DashboardOverview;
}

const gridClassName = cn(
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

export function HomeSummaryCards({ data = dashboardOverviewMock }: HomeSummaryCardsProps) {
  const { kpi } = data;

  return (
    <div className={gridClassName}>
      <Card className="@container/card">
        <CardHeader className="pb-2">
          <div className="w-fit rounded-lg bg-green-500/10 p-2">
            <Wallet className="size-5 text-green-500" />
          </div>
        </CardHeader>
        <CardContent className="space-y-1">
          <CardTitle className="text-sm @[200px]/card:text-base">Revenue</CardTitle>
          <CardDescription>This month</CardDescription>
          <p className="text-lg leading-tight font-semibold tabular-nums @[220px]/card:text-xl">
            {formatPrice(kpi.revenue.value)}
          </p>
          <DeltaBadge value={kpi.revenue.deltaPercent} />
        </CardContent>
        <CardFooter className="text-muted-foreground text-xs">See Finance for full breakdown</CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader className="pb-2">
          <div className="w-fit rounded-lg bg-blue-500/10 p-2">
            <Users className="size-5 text-blue-500" />
          </div>
        </CardHeader>
        <CardContent className="space-y-1">
          <CardTitle className="text-sm @[200px]/card:text-base">Active Members</CardTitle>
          <CardDescription>Current roster</CardDescription>
          <p className="text-2xl font-semibold tabular-nums">{kpi.activeMembers.value}</p>
          <DeltaBadge value={kpi.activeMembers.deltaPercent} />
        </CardContent>
        <CardFooter className="text-muted-foreground text-xs">
          +{kpi.activeMembers.newCount} new · {kpi.activeMembers.churnedCount} churned
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm @[200px]/card:text-base">Check-ins</CardTitle>
          <CardDescription>This week</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-semibold tabular-nums">{kpi.checkIns.value}</p>
          <DeltaBadge value={kpi.checkIns.deltaPercent} />
        </CardContent>
        <CardFooter className="text-muted-foreground text-xs">Studio attendance pulse</CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader className="pb-2">
          <div className="w-fit rounded-lg bg-yellow-500/10 p-2">
            <AlertTriangle className="size-5 text-yellow-500" />
          </div>
        </CardHeader>
        <CardContent className="space-y-1">
          <CardTitle className="text-sm @[200px]/card:text-base">Action Needed</CardTitle>
          <CardDescription>Requires attention</CardDescription>
          <p className="text-2xl font-semibold text-yellow-500 tabular-nums">{kpi.actionNeeded.value}</p>
        </CardContent>
        <CardFooter className="text-muted-foreground text-xs">Expiring, freezes & low fill</CardFooter>
      </Card>
    </div>
  );
}
