"use client";

import * as React from "react";

import { Plus } from "lucide-react";

import { DataTable } from "@/components/data-table/data-table";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import { DataTableViewOptions } from "@/components/data-table/data-table-view-options";
import { Button } from "@/components/ui/button";
import { useDataTableInstance } from "@/hooks/use-data-table-instance";

import { createMembershipColumns } from "./columns";
import { MembershipDetailDrawer } from "./membership-detail-drawer";
import { MembershipsSearch } from "./memberships-search";
import { MembershipsTableSkeleton } from "./memberships-table-skeleton";
import { PurchaseRecencyFilter, type PurchaseRecencyFilterValue } from "./purchase-recency-filter";
import { Membership } from "./schema";
import { StatusFilter } from "./status-filter";

type DrawerMode = "view" | "edit" | "add" | null;

interface MembershipsTableProps {
  data: Membership[];
  isLoading: boolean;
  purchaseRecency: PurchaseRecencyFilterValue;
  onPurchaseRecencyChange: (value: PurchaseRecencyFilterValue) => void;
  createdFrom: string;
  createdTo: string;
  onCreatedFromChange: (isoDate: string) => void;
  onCreatedToChange: (isoDate: string) => void;
  productId: string;
  onProductIdChange: (productId: string) => void;
}

export function MembershipsTable({
  data,
  isLoading,
  purchaseRecency,
  onPurchaseRecencyChange,
  createdFrom,
  createdTo,
  onCreatedFromChange,
  onCreatedToChange,
  productId,
  onProductIdChange,
}: MembershipsTableProps) {
  const [selectedStatus, setSelectedStatus] = React.useState("all");
  const [selectedMembership, setSelectedMembership] = React.useState<Membership | null>(null);
  const [drawerMode, setDrawerMode] = React.useState<DrawerMode>(null);
  const [drawerOpen, setDrawerOpen] = React.useState(false);

  const filteredData = React.useMemo(() => {
    if (selectedStatus === "all") return data;
    return data.filter((membership) => membership.status === selectedStatus);
  }, [data, selectedStatus]);

  // Actions for the table columns
  const actions = React.useMemo(
    () => ({
      onRowClick: (membership: Membership) => {
        setSelectedMembership(membership);
        setDrawerMode("view");
        setDrawerOpen(true);
      },
      onEdit: (membership: Membership) => {
        setSelectedMembership(membership);
        setDrawerMode("edit");
        setDrawerOpen(true);
      },
      onDelete: (membership: Membership) => {
        // Open drawer in view mode, then user can click delete button
        setSelectedMembership(membership);
        setDrawerMode("view");
        setDrawerOpen(true);
      },
    }),
    [],
  );

  const handleAddClick = () => {
    setSelectedMembership(null);
    setDrawerMode("add");
    setDrawerOpen(true);
  };

  const columns = React.useMemo(() => createMembershipColumns(actions), [actions]);

  const tableInstance = useDataTableInstance({
    data: filteredData,
    columns,
    defaultPageSize: 10,
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center">
          <MembershipsSearch
            value={tableInstance.getState().globalFilter ?? ""}
            onChange={(value) => tableInstance.setGlobalFilter(String(value))}
          />
          <StatusFilter value={selectedStatus} onChange={setSelectedStatus} />
          <PurchaseRecencyFilter
            value={purchaseRecency}
            onChange={onPurchaseRecencyChange}
            createdFrom={createdFrom}
            createdTo={createdTo}
            onCreatedFromChange={onCreatedFromChange}
            onCreatedToChange={onCreatedToChange}
            productId={productId}
            onProductIdChange={onProductIdChange}
          />
        </div>
        <div className="flex items-center gap-2">
          <DataTableViewOptions table={tableInstance} />
          <Button onClick={handleAddClick}>
            <Plus className="mr-2 h-4 w-4" />
            Add Membership
          </Button>
        </div>
      </div>

      {isLoading ? (
        <MembershipsTableSkeleton />
      ) : (
        <DataTable table={tableInstance} columns={columns} onRowClick={actions.onRowClick} />
      )}

      <DataTablePagination table={tableInstance} />

      <MembershipDetailDrawer
        membership={selectedMembership}
        mode={drawerMode}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onModeChange={setDrawerMode}
      />
    </div>
  );
}
