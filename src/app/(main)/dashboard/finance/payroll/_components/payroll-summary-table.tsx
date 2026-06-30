"use client";

import { format, parseISO } from "date-fns";
import { CalendarSearch, ListTree, User } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn, formatPrice } from "@/lib/utils";

export interface PayrollSummaryRow {
  teacherId: string;
  teacherName: string;
  teacherEmail: string | null;
  teacherImage?: string | null;
  sessionsCount: number;
  byItem: Array<{
    itemId: string;
    itemName: string;
    sessionsCount: number;
    sessionDates: string[];
    feeModel: "FLAT_PER_SESSION" | "PER_PARTICIPANT";
    feeAmount: number;
    perParticipantMinGuarantee: number | null;
    perParticipantGuaranteeMaxPax: number | null;
    totalParticipants: number;
    avgFeePerSession: number;
    totalFee: number;
  }>;
  totalFee: number;
}

interface PayrollSummaryTableProps {
  rows: PayrollSummaryRow[];
  grandTotalFee: number;
  isLoading?: boolean;
  embedded?: boolean;
}

function teacherInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

/** Day + abbreviated month + year (e.g. 1 May 2026). */
function formatSessionDateRange(dates: string[]): string {
  if (dates.length === 0) return "—";
  const sorted = [...dates].sort();
  const fmt = (iso: string) => format(parseISO(iso), "d MMM yyyy");
  if (sorted.length === 1) return fmt(sorted[0]);
  const first = fmt(sorted[0]);
  const last = fmt(sorted[sorted.length - 1]);
  if (first === last) return first;
  return `${first} – ${last}`;
}

function BreakdownByClassDialog({ row }: { row: PayrollSummaryRow }) {
  const count = row.byItem.length;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="shrink-0 gap-1.5">
          <ListTree className="h-4 w-4" aria-hidden />
          <span className="hidden sm:inline">Breakdown</span>
          <span className="text-muted-foreground tabular-nums sm:ml-0.5">({count})</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="flex max-h-[min(85vh,640px)] max-w-md flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="border-border shrink-0 border-b px-5 py-4 text-left">
          <DialogTitle>Breakdown by class</DialogTitle>
          <DialogDescription className="sr-only">
            Teacher {row.teacherName}
            {row.teacherEmail ? `, ${row.teacherEmail}` : ""}. {row.sessionsCount} session
            {row.sessionsCount !== 1 ? "s" : ""} in period. Period total {formatPrice(row.totalFee)}.
          </DialogDescription>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <div className="flex min-w-0 gap-3">
              <Avatar className="border-primary/20 size-11 shrink-0 border-2 shadow-sm">
                <AvatarImage src={row.teacherImage ?? undefined} alt="" />
                <AvatarFallback className="bg-primary/15 text-primary gap-0 rounded-full text-sm font-semibold">
                  {row.teacherName.trim() ? teacherInitials(row.teacherName) : <User className="size-5" aria-hidden />}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="text-foreground leading-snug font-semibold">{row.teacherName}</p>
                {row.teacherEmail ? (
                  <p className="text-muted-foreground mt-0.5 truncate text-xs">{row.teacherEmail}</p>
                ) : null}
              </div>
            </div>
            <div className="flex shrink-0 flex-wrap items-end justify-end gap-x-6 gap-y-2 sm:gap-x-8">
              <div className="text-right">
                <span className="text-muted-foreground block text-[11px] font-medium tracking-wide uppercase">
                  Total sessions
                </span>
                <span className="text-foreground text-xl font-bold tracking-tight tabular-nums">
                  {row.sessionsCount}
                </span>
              </div>
              <div className="text-right">
                <span className="text-muted-foreground block text-[11px] font-medium tracking-wide uppercase">
                  Period total
                </span>
                <span className="text-primary text-xl font-bold tracking-tight tabular-nums">
                  {formatPrice(row.totalFee)}
                </span>
              </div>
            </div>
          </div>
        </DialogHeader>
        <div className="max-h-[min(60vh,420px)] min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-3">
          <ul className="divide-border divide-y">
            {row.byItem.map((b) => (
              <li key={b.itemId} className="flex gap-3 py-2.5 first:pt-0 last:pb-0">
                <div className="min-w-0 flex-1">
                  <p className="text-foreground truncate text-sm leading-tight font-medium">{b.itemName}</p>
                  <p className="text-muted-foreground mt-0.5 text-xs leading-snug">
                    {b.sessionsCount} session{b.sessionsCount !== 1 ? "s" : ""}
                    <span className="text-border mx-1.5">·</span>
                    {formatSessionDateRange(b.sessionDates)}
                  </p>
                </div>
                <p className="text-foreground shrink-0 text-sm font-semibold tabular-nums">{formatPrice(b.totalFee)}</p>
              </li>
            ))}
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function PayrollSummaryTable({ rows, grandTotalFee, isLoading, embedded }: PayrollSummaryTableProps) {
  if (isLoading) {
    return <div className="text-muted-foreground flex items-center justify-center py-12">Loading summary…</div>;
  }

  if (rows.length === 0) {
    return (
      <div className="bg-muted/20 rounded-xl border border-dashed px-6 py-12 text-center">
        <div className="bg-background mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full border">
          <CalendarSearch className="text-muted-foreground h-4 w-4" />
        </div>
        <p className="text-foreground text-sm font-medium">No completed sessions found</p>
      </div>
    );
  }

  return (
    <div className={cn(!embedded && "rounded-md border", embedded && "overflow-x-auto")}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Teacher</TableHead>
            <TableHead className="text-right">Sessions</TableHead>
            <TableHead className="w-[1%] whitespace-nowrap">By class</TableHead>
            <TableHead className="text-right">Total fee</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.teacherId}>
              <TableCell>
                <div>
                  <p className="font-medium">{row.teacherName}</p>
                  {row.teacherEmail && <p className="text-muted-foreground text-xs">{row.teacherEmail}</p>}
                </div>
              </TableCell>
              <TableCell className="text-right tabular-nums">{row.sessionsCount}</TableCell>
              <TableCell>
                <BreakdownByClassDialog row={row} />
              </TableCell>
              <TableCell className="text-right font-medium tabular-nums">{formatPrice(row.totalFee)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={3} className="text-right font-semibold">
              Grand total
            </TableCell>
            <TableCell className="text-right font-semibold tabular-nums">{formatPrice(grandTotalFee)}</TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  );
}
