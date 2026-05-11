"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Building2, Eye, Edit, Trash2, MoreHorizontal, Users } from "lucide-react";

import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StatusBadge } from "@/components/ui/status-badge";

import { Item } from "./schema";

interface ItemActions {
  onViewItem: (item: Item) => void;
  onEditItem: (item: Item) => void;
  onDeleteItem: (item: Item) => void;
}

export const createItemColumns = (actions: ItemActions): ColumnDef<Item>[] => [
  {
    id: "select",
    header: ({ table }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "name",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Item Name" />,
    cell: ({ row }) => {
      const item = row.original;
      return (
        <div
          className="hover:text-primary flex max-w-[250px] min-w-0 cursor-pointer flex-col gap-1 transition-colors"
          onClick={() => actions.onViewItem(item)}
        >
          <div className="flex min-w-0 items-center gap-2">
            {item.color && (
              <div className="h-3 w-3 flex-shrink-0 rounded-full border" style={{ backgroundColor: item.color }} />
            )}
            <span className="truncate font-medium" title={item.name}>
              {item.name}
            </span>
          </div>
        </div>
      );
    },
    meta: {
      className: "whitespace-normal",
    },
    size: 200,
    minSize: 180,
    maxSize: 220,
  },
  {
    id: "stores",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Brand" />,
    cell: ({ row }) => {
      const item = row.original as Item & {
        itemBrands?: { brand: { name: string } }[];
        brandIds?: string[];
      };
      const label =
        item.itemBrands?.map((ib) => ib.brand.name).join(", ") ||
        (item.brandIds?.length ? `${item.brandIds.length} stores` : "—");
      return (
        <div className="text-muted-foreground flex max-w-[220px] items-start gap-1 text-sm">
          <Building2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span className="min-w-0 leading-snug break-words" title={label}>
            {label}
          </span>
        </div>
      );
    },
    meta: { className: "whitespace-normal" },
  },
  {
    accessorKey: "duration",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Duration" />,
    cell: ({ row }) => {
      const duration = row.original.duration;
      return <span className="text-sm">{duration} min</span>;
    },
  },
  {
    accessorKey: "capacity",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Max Capacity" />,
    cell: ({ row }) => {
      const capacity = row.original.capacity;
      return <span className="text-sm">{capacity}</span>;
    },
  },
  {
    accessorKey: "isActive",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    cell: ({ row }) => {
      const isActive = row.original.isActive;
      return <StatusBadge variant={isActive ? "success" : "secondary"}>{isActive ? "Active" : "Inactive"}</StatusBadge>;
    },
  },
  {
    id: "teachers",
    header: "Teachers",
    cell: ({ row }) => {
      const item = row.original as Item & { _count?: { teacherItems: number } };
      const teacherCount = item._count?.teacherItems || 0;
      return (
        <StatusBadge variant="outline" className="gap-1">
          <Users className="h-3 w-3" />
          {teacherCount}
        </StatusBadge>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const item = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => actions.onViewItem(item)}>
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => actions.onEditItem(item)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => actions.onDeleteItem(item)} className="text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
    enableSorting: false,
  },
];
