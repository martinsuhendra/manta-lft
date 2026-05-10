import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { MoreHorizontal } from "lucide-react";

import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatPrice } from "@/lib/utils";

import { formatPaymentMethodLabel, formatStatusLabel } from "./format-labels";
import { TransactionListItem } from "./schema";

function getStatusVariant(status: string): "default" | "secondary" | "destructive" | "outline" | "warning" | "success" {
  if (status === "COMPLETED") return "success";
  if (status === "PENDING") return "warning";
  if (status === "FAILED" || status === "CANCELLED") return "destructive";
  if (status === "REFUNDED" || status === "EXPIRED") return "outline";
  return "secondary";
}

export function createTransactionColumns({
  onEdit,
  onDelete,
}: {
  onEdit: (transaction: TransactionListItem) => void;
  onDelete: (transaction: TransactionListItem) => void;
}): ColumnDef<TransactionListItem>[] {
  return [
    {
      accessorKey: "userName",
      header: ({ column }) => <DataTableColumnHeader column={column} title="User" />,
      cell: ({ row }) => (
        <div className="min-w-[220px]">
          <p className="font-medium">{row.original.userName}</p>
          <p className="text-muted-foreground text-xs">{row.original.email ?? "-"}</p>
        </div>
      ),
    },
    {
      accessorKey: "productName",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Product" />,
      cell: ({ row }) => <span>{row.original.productName}</span>,
    },
    {
      accessorKey: "amount",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Amount" />,
      cell: ({ row }) => (
        <span className="font-medium">
          {formatPrice(row.original.amount)} {row.original.currency}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
      cell: ({ row }) => (
        <StatusBadge variant={getStatusVariant(row.original.status)}>
          {formatStatusLabel(row.original.status)}
        </StatusBadge>
      ),
    },
    {
      accessorKey: "paymentMethod",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Method" />,
      cell: ({ row }) => formatPaymentMethodLabel(row.original.paymentMethod),
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Created At" />,
      cell: ({ row }) => format(new Date(row.original.createdAt), "dd MMM yyyy"),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={(event) => event.stopPropagation()}
              className="h-8 w-8"
              aria-label="Open actions"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={(event) => {
                event.stopPropagation();
                onEdit(row.original);
              }}
            >
              Edit transaction
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={(event) => {
                event.stopPropagation();
                onDelete(row.original);
              }}
            >
              Delete transaction
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
      enableSorting: false,
      enableHiding: false,
    },
  ];
}
