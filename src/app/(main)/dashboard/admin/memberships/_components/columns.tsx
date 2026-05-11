"use client";

import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { MoreHorizontal, Edit, Trash2, Eye } from "lucide-react";

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

import { Membership } from "./schema";

interface ActionsType {
  onRowClick: (membership: Membership) => void;
  onEdit: (membership: Membership) => void;
  onDelete: (membership: Membership) => void;
}

export const createMembershipColumns = (actions: ActionsType): ColumnDef<Membership>[] => [
  {
    accessorKey: "user.name",
    header: ({ column }) => <DataTableColumnHeader column={column} title="User" />,
    cell: ({ row }) => {
      const membership = row.original;
      return (
        <div className="flex flex-col">
          <span className="font-medium">{membership.user.name || "N/A"}</span>
          <span className="text-muted-foreground text-sm">{membership.user.email}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "product.name",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Product" />,
    cell: ({ row }) => {
      const membership = row.original;
      return (
        <div className="flex flex-col">
          <span className="font-medium">{membership.product.name}</span>
          <span className="text-muted-foreground text-sm">
            {formatPrice(membership.product.price)} • {membership.product.validDays} days
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    cell: ({ row }) => {
      const status = row.getValue("status");
      const variant =
        status === "ACTIVE"
          ? "success"
          : status === "FREEZED"
            ? "secondary"
            : status === "PENDING"
              ? "warning"
              : status === "EXPIRED"
                ? "destructive"
                : status === "SUSPENDED"
                  ? "secondary"
                  : "outline";

      const formatStatus = (str: string) => {
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
      };

      return <StatusBadge variant={variant}>{formatStatus(String(status))}</StatusBadge>;
    },
  },
  // Quota column removed - quota management now handled through product items and quota pools
  {
    accessorKey: "expiredAt",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Expires" />,
    cell: ({ row }) => {
      const expiredAt = new Date(row.getValue("expiredAt"));
      const isExpired = expiredAt < new Date();

      return (
        <span className={isExpired ? "text-destructive font-medium" : ""}>{format(expiredAt, "dd MMM, yyyy")}</span>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Created" />,
    cell: ({ row }) => {
      const createdAt = new Date(row.getValue("createdAt"));
      return <span>{format(createdAt, "dd MMM, yyyy")}</span>;
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const membership = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="h-8 w-8 p-0"
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                actions.onRowClick(membership);
              }}
            >
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                actions.onEdit(membership);
              }}
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                actions.onDelete(membership);
              }}
              className="text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
