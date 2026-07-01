"use client";

import { ArrowDownLeft, Clock, Wallet } from "lucide-react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import {
  dashboardOverviewMock,
  revenueByMonthChartConfig,
} from "@/app/(main)/dashboard/_shared/overview/overview.config";
import type { DashboardOverview } from "@/app/(main)/dashboard/_shared/overview/schema";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { formatPrice } from "@/lib/utils";

interface FinanceRevenueChartProps {
  data?: DashboardOverview;
}

export function FinanceRevenueChart({ data = dashboardOverviewMock }: FinanceRevenueChartProps) {
  const { revenueByMonth, revenueSummary } = data;

  return (
    <Card className="shadow-xs">
      <CardHeader>
        <CardTitle>Revenue Trend</CardTitle>
        <CardDescription>Monthly income vs check-in volume</CardDescription>
        <CardAction>
          <Select defaultValue="last-6">
            <SelectTrigger className="h-8">
              <SelectValue placeholder="Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last-6">Last 6 months</SelectItem>
              <SelectItem value="ytd">Year to date</SelectItem>
              <SelectItem value="last-year">Last year</SelectItem>
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent>
        <Separator />
        <div className="flex flex-col items-start justify-between gap-2 py-5 md:flex-row md:items-stretch md:gap-0">
          <div className="flex flex-1 items-center justify-center gap-2">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full border">
              <ArrowDownLeft className="stroke-chart-1 size-6" />
            </div>
            <div>
              <p className="text-muted-foreground text-xs uppercase">Income</p>
              <p className="font-medium tabular-nums">{formatPrice(revenueSummary.income)}</p>
            </div>
          </div>
          <Separator orientation="vertical" className="!h-auto" />
          <div className="flex flex-1 items-center justify-center gap-2">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full border">
              <Wallet className="stroke-chart-2 size-6" />
            </div>
            <div>
              <p className="text-muted-foreground text-xs uppercase">Refunds</p>
              <p className="font-medium tabular-nums">{formatPrice(revenueSummary.refunds)}</p>
            </div>
          </div>
          <Separator orientation="vertical" className="!h-auto" />
          <div className="flex flex-1 items-center justify-center gap-2">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full border">
              <Clock className="stroke-chart-3 size-6" />
            </div>
            <div>
              <p className="text-muted-foreground text-xs uppercase">Pending</p>
              <p className="font-medium tabular-nums">{formatPrice(revenueSummary.pending)}</p>
            </div>
          </div>
        </div>
        <Separator />
        <ChartContainer className="mt-4 max-h-72 w-full" config={revenueByMonthChartConfig}>
          <BarChart margin={{ left: -20, right: 0, top: 16, bottom: 0 }} accessibilityLayer data={revenueByMonth}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
            <YAxis yAxisId="income" hide />
            <YAxis yAxisId="checkIns" orientation="right" hide />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar yAxisId="income" dataKey="income" fill="var(--color-income)" radius={[4, 4, 0, 0]} />
            <Bar
              yAxisId="checkIns"
              dataKey="checkIns"
              fill="var(--color-checkIns)"
              radius={[4, 4, 0, 0]}
              opacity={0.7}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
