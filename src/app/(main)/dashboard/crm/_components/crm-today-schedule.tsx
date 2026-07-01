"use client";

import Link from "next/link";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowRight } from "lucide-react";

import { dashboardOverviewMock } from "@/app/(main)/dashboard/_shared/overview/overview.config";
import type { DashboardOverview, TodaySession } from "@/app/(main)/dashboard/_shared/overview/schema";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { StatusBadge } from "@/components/ui/status-badge";
import { useDataTableInstance } from "@/hooks/use-data-table-instance";

const sessionStatusVariant: Record<TodaySession["status"], "success" | "secondary" | "destructive"> = {
  SCHEDULED: "secondary",
  COMPLETED: "success",
  CANCELLED: "destructive",
};

const todaySessionColumns: ColumnDef<TodaySession>[] = [
  {
    accessorKey: "time",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Time" />,
    cell: ({ row }) => <span className="font-medium tabular-nums">{row.original.time}</span>,
  },
  {
    accessorKey: "className",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Class" />,
    cell: ({ row }) => <span>{row.original.className}</span>,
  },
  {
    accessorKey: "teacher",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Teacher" />,
    cell: ({ row }) => <span className="text-muted-foreground">{row.original.teacher}</span>,
  },
  {
    id: "fill",
    header: "Booked",
    cell: ({ row }) => {
      const { booked, capacity } = row.original;
      const percent = Math.round((booked / capacity) * 100);
      return (
        <div className="flex min-w-[120px] items-center gap-2">
          <Progress value={percent} className="h-2 flex-1" />
          <span className="text-muted-foreground text-xs tabular-nums">
            {booked}/{capacity}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <StatusBadge variant={sessionStatusVariant[row.original.status]}>{row.original.status}</StatusBadge>
    ),
  },
];

interface CrmTodayScheduleProps {
  data?: DashboardOverview;
}

export function CrmTodaySchedule({ data = dashboardOverviewMock }: CrmTodayScheduleProps) {
  const table = useDataTableInstance({
    data: data.todaySessions,
    columns: todaySessionColumns,
    getRowId: (row) => row.id,
  });

  return (
    <Card className="shadow-xs">
      <CardHeader>
        <CardTitle>Today at the Studio</CardTitle>
        <CardDescription>Upcoming sessions and live fill rates</CardDescription>
        <CardAction>
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/admin/sessions">
              View all
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        {data.todaySessions.length === 0 ? (
          <p className="text-muted-foreground py-8 text-center text-sm">No sessions scheduled today</p>
        ) : (
          <DataTable table={table} columns={todaySessionColumns} />
        )}
      </CardContent>
    </Card>
  );
}
