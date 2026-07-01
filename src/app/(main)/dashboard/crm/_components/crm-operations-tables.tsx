"use client";

import { ColumnDef } from "@tanstack/react-table";

import { dashboardOverviewMock } from "@/app/(main)/dashboard/_shared/overview/overview.config";
import type { DashboardOverview } from "@/app/(main)/dashboard/_shared/overview/schema";
import { DataTable } from "@/components/data-table/data-table";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useDataTableInstance } from "@/hooks/use-data-table-instance";

import { expiringMembershipColumns, freezeRequestColumns, lowFillSessionColumns } from "./columns.crm";

interface CrmOperationsTablesProps {
  data?: DashboardOverview;
}

interface OperationsTableCardProps<T extends { id: string }> {
  title: string;
  description: string;
  data: T[];
  columns: ColumnDef<T>[];
}

function OperationsTableCard<T extends { id: string }>({
  title,
  description,
  data,
  columns,
}: OperationsTableCardProps<T>) {
  const table = useDataTableInstance({
    data,
    columns,
    getRowId: (row) => row.id,
    enableRowSelection: false,
    defaultPageSize: Math.max(data.length, 5),
  });

  const showPagination = table.getPageCount() > 1;

  return (
    <Card className="@container/card min-w-0 shadow-xs">
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex min-w-0 flex-col gap-3">
        <DataTable table={table} columns={columns} className="min-w-0 overflow-x-auto" />
        {showPagination ? <DataTablePagination table={table} compact className="px-0" /> : null}
      </CardContent>
    </Card>
  );
}

export function CrmOperationsTables({ data = dashboardOverviewMock }: CrmOperationsTablesProps) {
  return (
    <div className="grid grid-cols-1 gap-4 *:min-w-0 lg:grid-cols-2 2xl:grid-cols-3">
      <OperationsTableCard
        title="Expiring Memberships"
        description="Renewal risk in the next 14 days"
        data={data.expiringMemberships}
        columns={expiringMembershipColumns}
      />
      <OperationsTableCard
        title="Freeze Requests"
        description="Membership pause queue"
        data={data.freezeRequests}
        columns={freezeRequestColumns}
      />
      <OperationsTableCard
        title="Low Fill Upcoming"
        description="Sessions below 50% capacity"
        data={data.lowFillSessions}
        columns={lowFillSessionColumns}
      />
    </div>
  );
}
