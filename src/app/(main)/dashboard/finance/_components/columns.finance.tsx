import { ColumnDef } from "@tanstack/react-table";

import type { RecentTransaction } from "@/app/(main)/dashboard/_shared/overview/schema";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatPrice } from "@/lib/utils";

const transactionStatusVariant: Record<
  RecentTransaction["status"],
  "success" | "warning" | "destructive" | "secondary"
> = {
  COMPLETED: "success",
  PENDING: "warning",
  FAILED: "destructive",
  PROCESSING: "secondary",
};

export const recentTransactionColumns: ColumnDef<RecentTransaction>[] = [
  {
    accessorKey: "member",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Member" />,
    cell: ({ row }) => <span className="font-medium">{row.original.member}</span>,
  },
  {
    accessorKey: "product",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Product" />,
    cell: ({ row }) => <span className="text-muted-foreground">{row.original.product}</span>,
  },
  {
    accessorKey: "amount",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Amount" />,
    cell: ({ row }) => <span className="tabular-nums">{formatPrice(row.original.amount)}</span>,
  },
  {
    accessorKey: "status",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    cell: ({ row }) => (
      <StatusBadge variant={transactionStatusVariant[row.original.status]}>{row.original.status}</StatusBadge>
    ),
  },
  {
    accessorKey: "paidAt",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Paid at" />,
    cell: ({ row }) => <span className="text-muted-foreground text-xs tabular-nums">{row.original.paidAt}</span>,
  },
];
