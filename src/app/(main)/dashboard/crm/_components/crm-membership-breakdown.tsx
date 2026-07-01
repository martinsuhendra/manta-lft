"use client";

import { Label, Pie, PieChart } from "recharts";

import {
  dashboardOverviewMock,
  membershipStatusChartConfig,
} from "@/app/(main)/dashboard/_shared/overview/overview.config";
import type { DashboardOverview } from "@/app/(main)/dashboard/_shared/overview/schema";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

interface CrmMembershipBreakdownProps {
  data?: DashboardOverview;
}

const statusLabels: Record<string, string> = {
  ACTIVE: "Active",
  FREEZED: "Frozen",
  EXPIRED: "Expired",
  PENDING: "Pending",
};

export function CrmMembershipBreakdown({ data = dashboardOverviewMock }: CrmMembershipBreakdownProps) {
  const chartData = data.membershipStatus.map((item) => ({
    ...item,
    label: statusLabels[item.status] ?? item.status,
  }));
  const total = chartData.reduce((sum, item) => sum + item.count, 0);
  const activeCount = chartData.find((item) => item.status === "ACTIVE")?.count ?? 0;

  return (
    <Card className="shadow-xs">
      <CardHeader>
        <CardTitle>Membership Status</CardTitle>
      </CardHeader>
      <CardContent className="flex justify-center py-2">
        <ChartContainer
          config={membershipStatusChartConfig}
          className="aspect-square h-[220px] w-full max-w-[220px] [&_.recharts-responsive-container]:!h-full"
        >
          <PieChart margin={{ top: 4, right: 4, left: 4, bottom: 4 }}>
            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
            <Pie
              data={chartData}
              dataKey="count"
              nameKey="label"
              innerRadius={58}
              outerRadius={78}
              paddingAngle={2}
              cornerRadius={4}
              strokeWidth={2}
            >
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className="fill-foreground text-2xl font-bold tabular-nums"
                        >
                          {activeCount}
                        </tspan>
                        <tspan x={viewBox.cx} y={(viewBox.cy ?? 0) + 20} className="fill-muted-foreground text-xs">
                          Active
                        </tspan>
                      </text>
                    );
                  }
                  return null;
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
      <CardFooter>
        <div className="grid w-full grid-cols-2 gap-2 text-sm">
          {chartData.map((item) => (
            <div key={item.status} className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground">{item.label}</span>
              <span className="font-medium tabular-nums">
                {item.count}
                <span className="text-muted-foreground ml-1 text-xs">({Math.round((item.count / total) * 100)}%)</span>
              </span>
            </div>
          ))}
        </div>
      </CardFooter>
    </Card>
  );
}
