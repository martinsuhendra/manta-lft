"use client";

import { format } from "date-fns";

import { StatusBadge } from "@/components/ui/status-badge";
import { TableCell, TableRow } from "@/components/ui/table";

import {
  formatStatusLabel,
  getBookingStatusIcon,
  getBookingStatusVariant,
  getSessionStatusVariant,
} from "../../_components/tabs/utils";

interface MembershipAttendanceItem {
  id: string;
  status: string;
  createdAt: string;
  classSession: {
    date: string;
    startTime: string;
    endTime: string;
    status: string;
    item: {
      name: string;
    };
  };
}

interface MembershipAttendanceTableProps {
  items: MembershipAttendanceItem[];
}

export function MembershipAttendanceTable({ items }: MembershipAttendanceTableProps) {
  if (items.length === 0) {
    return (
      <TableRow>
        <TableCell colSpan={6} className="text-muted-foreground py-8 text-center">
          No attendances for this membership yet.
        </TableCell>
      </TableRow>
    );
  }

  return (
    <>
      {items.map((attendance) => (
        <TableRow key={attendance.id} className="cursor-default">
          <TableCell className="font-medium">{attendance.classSession.item.name}</TableCell>
          <TableCell>{format(new Date(attendance.classSession.date), "MMM dd, yyyy")}</TableCell>
          <TableCell>
            {attendance.classSession.startTime} - {attendance.classSession.endTime}
          </TableCell>
          <TableCell>
            <StatusBadge variant={getBookingStatusVariant(attendance.status)}>
              <span className="mr-1">{getBookingStatusIcon(attendance.status)}</span>
              {formatStatusLabel(attendance.status)}
            </StatusBadge>
          </TableCell>
          <TableCell>
            <StatusBadge variant={getSessionStatusVariant(attendance.classSession.status)}>
              {formatStatusLabel(attendance.classSession.status)}
            </StatusBadge>
          </TableCell>
          <TableCell>{format(new Date(attendance.createdAt), "MMM dd, yyyy")}</TableCell>
        </TableRow>
      ))}
    </>
  );
}
