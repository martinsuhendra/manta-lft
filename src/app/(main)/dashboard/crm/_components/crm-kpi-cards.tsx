"use client";

import { AlertTriangle, Percent, TrendingDown, TrendingUp } from "lucide-react";
import { Area, AreaChart, Bar, BarChart, XAxis } from "recharts";

import {
  checkInsSparklineConfig,
  dashboardOverviewMock,
  memberGrowthChartConfig,
  signupsSparklineConfig,
} from "@/app/(main)/dashboard/_shared/overview/overview.config";
import type { DashboardOverview } from "@/app/(main)/dashboard/_shared/overview/schema";
import { sectionCardsGradientGridClassName } from "@/app/(main)/dashboard/_shared/overview/section-cards";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { StatusBadge } from "@/components/ui/status-badge";
import { cn } from "@/lib/utils";

interface CrmKpiCardsProps {
  data?: DashboardOverview;
}

const kpiGridClassName = cn(
  sectionCardsGradientGridClassName,
  "grid grid-cols-1 gap-4 *:min-w-0 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5",
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

export function CrmKpiCards({ data = dashboardOverviewMock }: CrmKpiCardsProps) {
  const { kpi, memberGrowthWeekly, checkInsSparkline, signupsWeekly } = data;

  return (
    <div className={kpiGridClassName}>
      <Card className="@container/card">
        <CardHeader>
          <CardTitle className="text-sm @[200px]/card:text-base">Active Members</CardTitle>
          <CardDescription>Membership health</CardDescription>
        </CardHeader>
        <CardContent className="size-full min-h-20">
          <ChartContainer className="size-full min-h-20" config={memberGrowthChartConfig}>
            <BarChart accessibilityLayer data={memberGrowthWeekly} barSize={8}>
              <XAxis dataKey="week" hide />
              <ChartTooltip content={<ChartTooltipContent hideIndicator />} />
              <Bar dataKey="newMembers" stackId="a" fill="var(--color-newMembers)" radius={[0, 0, 0, 0]} />
              <Bar dataKey="churned" stackId="a" fill="var(--color-churned)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </CardContent>
        <CardFooter className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xl font-semibold tabular-nums">{kpi.activeMembers.value}</span>
          <DeltaBadge value={kpi.activeMembers.deltaPercent} />
        </CardFooter>
      </Card>

      <Card className="@container/card overflow-hidden pb-0">
        <CardHeader>
          <CardTitle className="text-sm @[200px]/card:text-base">Check-ins</CardTitle>
          <CardDescription>This week</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 p-0">
          <ChartContainer className="size-full min-h-20" config={checkInsSparklineConfig}>
            <AreaChart data={checkInsSparkline} margin={{ left: 0, right: 0, top: 5, bottom: 0 }}>
              <XAxis dataKey="day" hide />
              <ChartTooltip content={<ChartTooltipContent hideIndicator />} />
              <Area
                type="monotone"
                dataKey="checkIns"
                stroke="var(--color-checkIns)"
                fill="var(--color-checkIns)"
                fillOpacity={0.08}
                strokeWidth={2}
              />
            </AreaChart>
          </ChartContainer>
        </CardContent>
        <CardFooter className="flex flex-wrap items-center justify-between gap-2 pb-4">
          <span className="text-xl font-semibold tabular-nums">{kpi.checkIns.value}</span>
          <DeltaBadge value={kpi.checkIns.deltaPercent} />
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <div className="w-fit rounded-lg bg-blue-500/10 p-2">
            <Percent className="size-5 text-blue-500" />
          </div>
        </CardHeader>
        <CardContent className="space-y-1">
          <CardTitle className="text-sm @[200px]/card:text-base">Avg Fill Rate</CardTitle>
          <CardDescription>Class utilization</CardDescription>
          <p className="text-2xl font-semibold tabular-nums">{kpi.fillRate.value}%</p>
          <p
            className={cn(
              "text-xs font-medium",
              kpi.fillRate.value >= kpi.fillRate.target ? "text-green-500" : "text-yellow-500",
            )}
          >
            Target {kpi.fillRate.target}%
          </p>
        </CardContent>
        <CardFooter className="text-muted-foreground text-xs">Booked slots vs capacity</CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardTitle className="text-sm @[200px]/card:text-base">New Signups</CardTitle>
          <CardDescription>This month</CardDescription>
        </CardHeader>
        <CardContent className="size-full min-h-20">
          <ChartContainer className="size-full min-h-20" config={signupsSparklineConfig}>
            <BarChart accessibilityLayer data={signupsWeekly} barSize={10}>
              <XAxis dataKey="week" hide />
              <ChartTooltip content={<ChartTooltipContent hideIndicator />} />
              <Bar dataKey="signups" fill="var(--color-signups)" radius={4} />
            </BarChart>
          </ChartContainer>
        </CardContent>
        <CardFooter className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xl font-semibold tabular-nums">{kpi.newSignups.value}</span>
          <DeltaBadge value={kpi.newSignups.deltaPercent} />
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
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
