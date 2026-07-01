"use client";

import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from "recharts";

import {
  dashboardOverviewMock,
  revenueByProductChartConfig,
} from "@/app/(main)/dashboard/_shared/overview/overview.config";
import type { DashboardOverview } from "@/app/(main)/dashboard/_shared/overview/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { formatPrice } from "@/lib/utils";

interface FinanceRevenueByProductProps {
  data?: DashboardOverview;
}

export function FinanceRevenueByProduct({ data = dashboardOverviewMock }: FinanceRevenueByProductProps) {
  const { revenueByProduct } = data;

  return (
    <Card className="shadow-xs">
      <CardHeader>
        <CardTitle>Revenue by Product</CardTitle>
      </CardHeader>
      <CardContent className="min-h-64">
        <ChartContainer config={revenueByProductChartConfig} className="size-full min-h-64">
          <BarChart layout="vertical" data={revenueByProduct} margin={{ left: 0, right: 16, top: 0, bottom: 0 }}>
            <CartesianGrid horizontal={false} />
            <YAxis dataKey="product" type="category" width={120} tickLine={false} axisLine={false} fontSize={12} />
            <XAxis type="number" hide />
            <ChartTooltip content={<ChartTooltipContent formatter={(v) => formatPrice(Number(v))} />} />
            <Bar dataKey="revenue" fill="var(--color-revenue)" radius={4}>
              <LabelList
                dataKey="percentage"
                position="right"
                formatter={(v: number) => `${v}%`}
                className="fill-foreground text-xs"
              />
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
