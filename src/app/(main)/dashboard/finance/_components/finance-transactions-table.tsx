"use client";

import Link from "next/link";

import { ArrowRight } from "lucide-react";

import { dashboardOverviewMock } from "@/app/(main)/dashboard/_shared/overview/overview.config";
import type { DashboardOverview } from "@/app/(main)/dashboard/_shared/overview/schema";
import { DataTable } from "@/components/data-table/data-table";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useDataTableInstance } from "@/hooks/use-data-table-instance";

import { recentTransactionColumns } from "./columns.finance";

interface FinanceTransactionsTableProps {
  data?: DashboardOverview;
}

export function FinanceTransactionsTable({ data = dashboardOverviewMock }: FinanceTransactionsTableProps) {
  const table = useDataTableInstance({
    data: data.recentTransactions,
    columns: recentTransactionColumns,
    getRowId: (row) => row.id,
  });

  return (
    <Card className="shadow-xs">
      <CardHeader>
        <CardTitle>Recent Transactions</CardTitle>
        <CardDescription>Latest membership payments</CardDescription>
        <CardAction>
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/finance/transactions">
              View all
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <DataTable table={table} columns={recentTransactionColumns} />
        <DataTablePagination table={table} />
      </CardContent>
    </Card>
  );
}
