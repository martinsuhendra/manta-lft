"use client";

import * as React from "react";

import Link from "next/link";
import { useParams } from "next/navigation";

import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Loader2 } from "lucide-react";

import { DataTable } from "@/components/data-table/data-table";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import { DataTableViewOptions } from "@/components/data-table/data-table-view-options";
import { Button } from "@/components/ui/button";
import { useDataTableInstance } from "@/hooks/use-data-table-instance";

import { createMembershipHistoryColumns } from "../../_components/membership-history-columns";
import { MemberDetails } from "../../_components/schema";

import { MembershipAttendanceDialog } from "./membership-attendance-dialog";

export default function MemberMembershipsPage() {
  const params = useParams();
  const memberId = params.id as string;
  const [selectedMembershipId, setSelectedMembershipId] = React.useState<string | null>(null);

  const {
    data: memberDetails,
    isLoading,
    error,
  } = useQuery<MemberDetails>({
    queryKey: ["member-details", memberId, "memberships"],
    queryFn: async () => {
      const response = await fetch(`/api/users/${memberId}/details?include=memberships`);
      if (!response.ok) throw new Error("Failed to fetch member details");
      return response.json();
    },
  });

  const selectedMembership = React.useMemo(() => {
    if (!selectedMembershipId) return null;
    return (memberDetails?.memberships ?? []).find((membership) => membership.id === selectedMembershipId) ?? null;
  }, [memberDetails?.memberships, selectedMembershipId]);

  const columns = React.useMemo(
    () =>
      createMembershipHistoryColumns({
        onViewAttendances: (membership) => setSelectedMembershipId(membership.id),
      }),
    [],
  );

  const table = useDataTableInstance({
    data: memberDetails?.memberships ?? [],
    columns,
    getRowId: (row) => row.id,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-destructive text-lg font-semibold">Error loading memberships</p>
        <p className="text-muted-foreground mt-2 text-sm">{error.message}</p>
      </div>
    );
  }

  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/users">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Membership History</h1>
            <p className="text-muted-foreground">
              {memberDetails?.name ?? "Member"}&apos;s complete membership history
            </p>
          </div>
        </div>
        <DataTableViewOptions table={table} />
      </div>

      <DataTable table={table} columns={columns} />
      <DataTablePagination table={table} />

      <MembershipAttendanceDialog
        memberId={memberId}
        memberName={memberDetails?.name}
        selectedMembershipId={selectedMembershipId}
        selectedMembershipProductName={selectedMembership?.product.name}
        open={selectedMembershipId !== null}
        onOpenChange={(isOpen) => {
          if (!isOpen) setSelectedMembershipId(null);
        }}
      />
    </div>
  );
}
