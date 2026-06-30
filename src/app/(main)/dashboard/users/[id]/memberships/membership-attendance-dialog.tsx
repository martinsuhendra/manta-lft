"use client";

import * as React from "react";

import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";

import { MembershipAttendanceTable } from "./membership-attendance-table";

interface MembershipAttendanceResponse {
  items: React.ComponentProps<typeof MembershipAttendanceTable>["items"];
  pagination: {
    page: number;
    total: number;
    totalPages: number;
  };
}

interface MembershipAttendanceDialogProps {
  memberId: string;
  memberName?: string | null;
  selectedMembershipId: string | null;
  selectedMembershipProductName?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function AttendanceDialogBody({
  attendanceQuery,
  attendancePage,
  onPageChange,
}: {
  attendanceQuery: {
    isLoading: boolean;
    isFetching: boolean;
    error: Error | null;
    data?: MembershipAttendanceResponse;
  };
  attendancePage: number;
  onPageChange: (page: number) => void;
}) {
  if (attendanceQuery.isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="text-muted-foreground h-5 w-5 animate-spin" />
      </div>
    );
  }

  if (attendanceQuery.error) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
        <p className="text-destructive text-sm font-medium">Failed to load membership attendances</p>
        <p className="text-muted-foreground text-xs">{attendanceQuery.error.message}</p>
      </div>
    );
  }

  const total = attendanceQuery.data?.pagination.total ?? 0;
  const totalPages = attendanceQuery.data?.pagination.totalPages ?? 1;

  return (
    <div className="space-y-4 overflow-hidden">
      <div className="text-muted-foreground flex items-center justify-between text-xs">
        <span>
          {total} attendance{total !== 1 ? "s" : ""}
        </span>
        <span>
          Page {attendanceQuery.data?.pagination.page ?? 1} of {totalPages}
        </span>
      </div>

      <div className="max-h-[55vh] overflow-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Class</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Session Status</TableHead>
              <TableHead>Booked At</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <MembershipAttendanceTable items={attendanceQuery.data?.items ?? []} />
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.max(1, attendancePage - 1))}
          disabled={attendancePage <= 1 || attendanceQuery.isFetching}
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          Previous
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.min(totalPages, attendancePage + 1))}
          disabled={attendancePage >= totalPages || attendanceQuery.isFetching}
        >
          Next
          <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export function MembershipAttendanceDialog({
  memberId,
  memberName,
  selectedMembershipId,
  selectedMembershipProductName,
  open,
  onOpenChange,
}: MembershipAttendanceDialogProps) {
  const [attendancePage, setAttendancePage] = React.useState(1);
  const attendancePageSize = 10;

  React.useEffect(() => {
    if (open) setAttendancePage(1);
  }, [open, selectedMembershipId]);

  const attendanceQuery = useQuery<MembershipAttendanceResponse>({
    queryKey: ["membership-attendances", memberId, selectedMembershipId, attendancePage, attendancePageSize],
    queryFn: async () => {
      if (!selectedMembershipId) throw new Error("No membership selected");
      const response = await fetch(
        `/api/users/${memberId}/memberships/${selectedMembershipId}/attendances?page=${attendancePage}&pageSize=${attendancePageSize}`,
      );
      if (!response.ok) throw new Error("Failed to fetch membership attendances");
      return response.json();
    },
    enabled: open && !!selectedMembershipId,
    placeholderData: (previousData) => previousData,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-hidden sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Membership Attendances</DialogTitle>
          <DialogDescription>
            {selectedMembershipProductName
              ? `${memberName ?? "Member"} — ${selectedMembershipProductName}`
              : "Attendance history for this membership"}
          </DialogDescription>
        </DialogHeader>

        <AttendanceDialogBody
          attendanceQuery={attendanceQuery}
          attendancePage={attendancePage}
          onPageChange={setAttendancePage}
        />
      </DialogContent>
    </Dialog>
  );
}
