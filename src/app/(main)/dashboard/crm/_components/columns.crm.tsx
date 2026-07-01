import { ColumnDef } from "@tanstack/react-table";

import type { ExpiringMembership, FreezeRequest, LowFillSession } from "@/app/(main)/dashboard/_shared/overview/schema";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { StatusBadge } from "@/components/ui/status-badge";

function FillRateCell({ percent }: { percent: number }) {
  return (
    <span className={`text-sm font-medium tabular-nums ${percent < 50 ? "text-yellow-500" : "text-foreground"}`}>
      {percent}%
    </span>
  );
}

const freezeStatusVariant: Record<FreezeRequest["status"], "success" | "warning" | "destructive"> = {
  PENDING: "warning",
  APPROVED: "success",
  REJECTED: "destructive",
};

export const expiringMembershipColumns: ColumnDef<ExpiringMembership>[] = [
  {
    accessorKey: "member",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Member" />,
    cell: ({ row }) => <span className="block max-w-[7rem] truncate font-medium">{row.original.member}</span>,
  },
  {
    accessorKey: "product",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Product" />,
    cell: ({ row }) => (
      <span className="text-muted-foreground block max-w-[8rem] truncate text-xs @[22rem]/card:max-w-none @[22rem]/card:text-sm">
        {row.original.product}
      </span>
    ),
  },
  {
    accessorKey: "expiresAt",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Expires" />,
    cell: ({ row }) => (
      <span className="text-xs whitespace-nowrap tabular-nums @[22rem]/card:text-sm">{row.original.expiresAt}</span>
    ),
  },
  {
    accessorKey: "daysLeft",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Days" />,
    cell: ({ row }) => (
      <StatusBadge variant={row.original.daysLeft <= 7 ? "warning" : "secondary"} className="whitespace-nowrap">
        {row.original.daysLeft}d
      </StatusBadge>
    ),
  },
];

export const freezeRequestColumns: ColumnDef<FreezeRequest>[] = [
  {
    accessorKey: "member",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Member" />,
    cell: ({ row }) => <span className="block max-w-[7rem] truncate font-medium">{row.original.member}</span>,
  },
  {
    id: "dates",
    header: "Period",
    cell: ({ row }) => (
      <div className="text-muted-foreground max-w-[9rem] text-xs tabular-nums @[22rem]/card:max-w-none">
        <span className="block truncate">{row.original.startDate}</span>
        <span className="block truncate">→ {row.original.endDate}</span>
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    cell: ({ row }) => (
      <StatusBadge variant={freezeStatusVariant[row.original.status]} className="text-xs whitespace-nowrap">
        {row.original.status}
      </StatusBadge>
    ),
  },
];

export const lowFillSessionColumns: ColumnDef<LowFillSession>[] = [
  {
    accessorKey: "session",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Session" />,
    cell: ({ row }) => <span className="block max-w-[8rem] truncate font-medium">{row.original.session}</span>,
  },
  {
    accessorKey: "date",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Date" />,
    cell: ({ row }) => (
      <span className="text-muted-foreground block max-w-[6rem] truncate text-xs whitespace-nowrap @[22rem]/card:max-w-none @[22rem]/card:text-sm">
        {row.original.date}
      </span>
    ),
  },
  {
    accessorKey: "fillPercent",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Fill" />,
    cell: ({ row }) => <FillRateCell percent={row.original.fillPercent} />,
  },
  {
    accessorKey: "spotsLeft",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Open" />,
    cell: ({ row }) => <span className="text-xs tabular-nums @[22rem]/card:text-sm">{row.original.spotsLeft}</span>,
  },
];
