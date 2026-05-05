"use client";

import { useMemo } from "react";

import { format } from "date-fns";
import { CalendarIcon, Filter } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useItems } from "@/hooks/use-items-query";
import { useTeachers } from "@/hooks/use-users-query";
import { cn } from "@/lib/utils";

export type PayrollFiltersState = {
  period?: "this-month" | "last-month" | "last-7-days" | "custom";
  startDate?: string;
  endDate?: string;
  teacherId?: string;
  itemId?: string;
};

function clampDateRange(startIso: string, endIso: string): { startDate: string; endDate: string } {
  if (startIso <= endIso) return { startDate: startIso, endDate: endIso };
  return { startDate: startIso, endDate: startIso };
}

/** `yyyy-MM-dd` in the user’s local calendar (`toISOString()` uses UTC and can move the day). */
function toYmd(d: Date): string {
  return format(d, "yyyy-MM-dd");
}

function getDefaultDates(period: PayrollFiltersState["period"]): { start: string; end: string } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const y = today.getFullYear();
  const m = today.getMonth();

  if (period === "last-month") {
    const start = new Date(y, m - 1, 1);
    const end = new Date(y, m, 0);
    return { start: toYmd(start), end: toYmd(end) };
  }
  if (period === "last-7-days") {
    const end = new Date(today);
    const start = new Date(today);
    start.setDate(start.getDate() - 6);
    return { start: toYmd(start), end: toYmd(end) };
  }
  // this-month or default
  const start = new Date(y, m, 1);
  const end = new Date(today);
  return { start: toYmd(start), end: toYmd(end) };
}

interface PayrollFiltersProps {
  filters: PayrollFiltersState;
  onFiltersChange: (f: PayrollFiltersState) => void;
  /** Hide teacher filter (e.g. teacher viewing own payroll only). */
  hideTeacherFilter?: boolean;
  /** Hide class/session filter. */
  hideItemFilter?: boolean;
  /** When set (e.g. teacher role), clear keeps this teacher selected. */
  lockedTeacherId?: string;
}

/* eslint-disable complexity */
export function PayrollFilters({
  filters,
  onFiltersChange,
  hideTeacherFilter = false,
  hideItemFilter = false,
  lockedTeacherId,
}: PayrollFiltersProps) {
  const period = filters.period ?? "this-month";
  const { start: defaultStart, end: defaultEnd } = getDefaultDates(period);
  const startDate = filters.startDate ?? defaultStart;
  const endDate = filters.endDate ?? defaultEnd;

  const { data: items = [] } = useItems({ enabled: !hideItemFilter });
  const { data: teachers = [] } = useTeachers(!hideTeacherFilter);

  const setPeriod = (p: PayrollFiltersState["period"]) => {
    const { start, end } = getDefaultDates(p);
    onFiltersChange({ ...filters, period: p, startDate: start, endDate: end });
  };

  const activeCount = [
    hideTeacherFilter ? undefined : filters.teacherId,
    hideItemFilter ? undefined : filters.itemId,
  ].filter(Boolean).length;

  const clearedParams = useMemo(
    () => getSummaryQueryParams(getClearedPayrollFilters(lockedTeacherId)),
    [lockedTeacherId],
  );
  const currentParams = useMemo(() => getSummaryQueryParams(filters), [filters]);
  const filtersDirty = useMemo(
    () =>
      currentParams.startDate !== clearedParams.startDate ||
      currentParams.endDate !== clearedParams.endDate ||
      (currentParams.teacherId ?? "") !== (clearedParams.teacherId ?? "") ||
      (currentParams.itemId ?? "") !== (clearedParams.itemId ?? ""),
    [currentParams, clearedParams],
  );

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm">
          <Filter className="mr-2 h-4 w-4" />
          Filters
          {activeCount > 0 && (
            <span className="bg-primary text-primary-foreground ml-2 flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs">
              {activeCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[380px]" align="start">
        <div className="space-y-4">
          <h4 className="font-medium">Period & filters</h4>
          <div className="space-y-2">
            <Label className="text-xs">Period</Label>
            <Select value={period} onValueChange={(v) => setPeriod(v as PayrollFiltersState["period"])}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="this-month">This month</SelectItem>
                <SelectItem value="last-month">Last month</SelectItem>
                <SelectItem value="last-7-days">Last 7 days</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">Start date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn("w-full justify-start text-left font-normal", !startDate && "text-muted-foreground")}
                  >
                    {startDate ? format(new Date(startDate + "T00:00:00"), "PPP") : "Pick date"}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate ? new Date(startDate + "T00:00:00") : undefined}
                    onSelect={(d) => {
                      if (!d) return;
                      const nextStart = toYmd(d);
                      const { startDate: sd, endDate: ed } = clampDateRange(nextStart, endDate);
                      onFiltersChange({ ...filters, period: "custom", startDate: sd, endDate: ed });
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">End date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn("w-full justify-start text-left font-normal", !endDate && "text-muted-foreground")}
                  >
                    {endDate ? format(new Date(endDate + "T00:00:00"), "PPP") : "Pick date"}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate ? new Date(endDate + "T00:00:00") : undefined}
                    onSelect={(d) => {
                      if (!d) return;
                      const nextEnd = toYmd(d);
                      const { startDate: sd, endDate: ed } = clampDateRange(startDate, nextEnd);
                      onFiltersChange({ ...filters, period: "custom", startDate: sd, endDate: ed });
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          {!hideTeacherFilter && (
            <div className="space-y-1">
              <Label className="text-xs">Teacher</Label>
              <Select
                value={filters.teacherId ?? "all"}
                onValueChange={(v) => onFiltersChange({ ...filters, teacherId: v === "all" ? undefined : v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All teachers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All teachers</SelectItem>
                  {teachers.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name ?? t.email ?? t.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {!hideItemFilter && (
            <div className="space-y-1">
              <Label className="text-xs">Session (class)</Label>
              <Select
                value={filters.itemId ?? "all"}
                onValueChange={(v) => onFiltersChange({ ...filters, itemId: v === "all" ? undefined : v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All sessions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All sessions</SelectItem>
                  {items.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-muted-foreground h-8 w-full"
            disabled={!filtersDirty}
            onClick={() => onFiltersChange(getClearedPayrollFilters(lockedTeacherId))}
          >
            Clear filters
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function getSummaryQueryParams(filters: PayrollFiltersState): {
  startDate: string;
  endDate: string;
  teacherId?: string;
  itemId?: string;
} {
  const period = filters.period ?? "this-month";
  const { start, end } = getDefaultDates(period);
  return {
    startDate: filters.startDate ?? start,
    endDate: filters.endDate ?? end,
    ...(filters.teacherId && { teacherId: filters.teacherId }),
    ...(filters.itemId && { itemId: filters.itemId }),
  };
}

/** Reset period to this month, drop teacher/class filters; keep `lockedTeacherId` when teachers may only see themselves. */
export function getClearedPayrollFilters(lockedTeacherId?: string): PayrollFiltersState {
  const { start, end } = getDefaultDates("this-month");
  return {
    period: "this-month",
    startDate: start,
    endDate: end,
    ...(lockedTeacherId ? { teacherId: lockedTeacherId } : {}),
  };
}
