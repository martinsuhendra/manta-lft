"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import {
  attendanceByItemChartConfig,
  dashboardOverviewMock,
  peakHoursChartConfig,
  sessionsByStatusChartConfig,
} from "@/app/(main)/dashboard/_shared/overview/overview.config";
import type { DashboardOverview } from "@/app/(main)/dashboard/_shared/overview/schema";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Progress } from "@/components/ui/progress";

interface CrmOperationsInsightsProps {
  data?: DashboardOverview;
}

export function CrmOperationsInsights({ data = dashboardOverviewMock }: CrmOperationsInsightsProps) {
  const { attendanceByItem, sessionsByStatus, peakHours, teacherWorkload } = data;

  return (
    <div className="grid grid-cols-1 gap-4 *:data-[slot=card]:shadow-xs sm:grid-cols-2 xl:grid-cols-4">
      <Card className="col-span-1">
        <CardHeader>
          <CardTitle>Attendance by Class</CardTitle>
        </CardHeader>
        <CardContent className="min-h-48">
          <ChartContainer config={attendanceByItemChartConfig} className="size-full min-h-48">
            <BarChart layout="vertical" data={attendanceByItem} margin={{ left: 0, right: 8, top: 0, bottom: 0 }}>
              <YAxis dataKey="item" type="category" width={90} tickLine={false} axisLine={false} fontSize={11} />
              <XAxis type="number" hide />
              <ChartTooltip content={<ChartTooltipContent hideIndicator />} />
              <Bar dataKey="checkIns" fill="var(--color-checkIns)" radius={4} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card className="col-span-1">
        <CardHeader>
          <CardTitle>Sessions This Week</CardTitle>
        </CardHeader>
        <CardContent className="min-h-48">
          <ChartContainer config={sessionsByStatusChartConfig} className="size-full min-h-48">
            <BarChart data={sessionsByStatus} margin={{ left: -20, right: 0, top: 0, bottom: 0 }}>
              <XAxis dataKey="day" tickLine={false} axisLine={false} fontSize={11} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="completed" stackId="a" fill="var(--color-completed)" radius={[0, 0, 0, 0]} />
              <Bar dataKey="scheduled" stackId="a" fill="var(--color-scheduled)" />
              <Bar dataKey="cancelled" stackId="a" fill="var(--color-cancelled)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card className="col-span-1">
        <CardHeader>
          <CardTitle>Peak Hours</CardTitle>
        </CardHeader>
        <CardContent className="min-h-48">
          <ChartContainer config={peakHoursChartConfig} className="size-full min-h-48">
            <BarChart data={peakHours} margin={{ left: -20, right: 0, top: 0, bottom: 0 }}>
              <XAxis dataKey="hour" tickLine={false} axisLine={false} fontSize={10} />
              <ChartTooltip content={<ChartTooltipContent hideIndicator />} />
              <Bar dataKey="bookings" fill="var(--color-bookings)" radius={4} />
            </BarChart>
          </ChartContainer>
        </CardContent>
        <CardFooter className="text-muted-foreground text-xs">Busiest: 5pm block</CardFooter>
      </Card>

      <Card className="col-span-1 sm:col-span-2 xl:col-span-4">
        <CardHeader>
          <CardTitle>Teacher Workload</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {teacherWorkload.map((teacher) => (
              <div key={teacher.teacher} className="space-y-1.5 rounded-lg border p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-medium">{teacher.teacher}</span>
                  <span className="text-muted-foreground shrink-0 text-xs tabular-nums">
                    {teacher.sessions} sessions
                  </span>
                </div>
                <Progress value={teacher.fillPercent} />
                <p className="text-muted-foreground text-xs tabular-nums">{teacher.fillPercent}% avg fill</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
