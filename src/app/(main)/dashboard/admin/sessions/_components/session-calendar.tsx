"use client";

import * as React from "react";
import { useState } from "react";

import { addDays, addWeeks, endOfWeek, format, startOfWeek, subDays, subWeeks } from "date-fns";
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useSessions } from "@/hooks/use-sessions-query";
import { cn } from "@/lib/utils";

import { Session, SessionFilter } from "./schema";
import { SessionDayTimetable } from "./session-day-timetable";
import { SessionWeekTimetable } from "./session-week-timetable";

const WEEK_STARTS_ON = 1;

interface CalendarViewConfig {
  mode: "day" | "week";
}

export interface DateSelectMeta {
  /** When true, parent only syncs date (no create dialog). */
  silent?: boolean;
  /** When opening the create dialog from the timetable, prefill start time (`HH:mm`). */
  defaultStartTime?: string;
}

interface SessionCalendarProps {
  filters: SessionFilter;
  onDateSelect: (date: Date, hasSessions?: boolean, sessions?: Session[], meta?: DateSelectMeta) => void;
  onSessionSelect: (session: Session) => void;
  onEditSession?: (session: Session) => void;
  /** Reserved for future cache invalidation; timetable uses `useSessions` query key from filters + day. */
  refreshTrigger?: number;
  /** Teacher (and similar): view-only, no create or session actions. */
  readOnly?: boolean;
}

export function SessionCalendar({
  filters,
  onDateSelect,
  onSessionSelect,
  onEditSession,
  refreshTrigger,
  readOnly = false,
}: SessionCalendarProps) {
  void refreshTrigger;
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const [viewConfig, setViewConfig] = useState<CalendarViewConfig>({ mode: "week" });

  const weekStart = startOfWeek(selectedDate, { weekStartsOn: WEEK_STARTS_ON });
  const weekEnd = endOfWeek(selectedDate, { weekStartsOn: WEEK_STARTS_ON });
  const isWeekMode = viewConfig.mode === "week";
  const startDateKey = format(isWeekMode ? weekStart : selectedDate, "yyyy-MM-dd");
  const endDateKey = format(isWeekMode ? weekEnd : selectedDate, "yyyy-MM-dd");

  const calendarFilters = React.useMemo<SessionFilter>(() => {
    return {
      ...(filters.teacherId ? { teacherId: filters.teacherId } : {}),
      ...(filters.itemId ? { itemId: filters.itemId } : {}),
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.visibility ? { visibility: filters.visibility } : {}),
      startDate: startDateKey,
      endDate: endDateKey,
    };
  }, [endDateKey, filters.itemId, filters.status, filters.teacherId, filters.visibility, startDateKey]);

  const { data: sessions = [], isLoading } = useSessions(calendarFilters);

  const commitDateToParent = React.useCallback(
    (date: Date) => {
      setSelectedDate(date);
      onDateSelect(date, true, [], { silent: true });
    },
    [onDateSelect],
  );

  React.useEffect(() => {
    onDateSelect(selectedDate, true, [], { silent: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- initial parent date sync
  }, []);

  const handlePrevDay = () => {
    if (isWeekMode) return commitDateToParent(subWeeks(selectedDate, 1));
    commitDateToParent(subDays(selectedDate, 1));
  };

  const handleNextDay = () => {
    if (isWeekMode) return commitDateToParent(addWeeks(selectedDate, 1));
    commitDateToParent(addDays(selectedDate, 1));
  };

  const handleToday = () => {
    commitDateToParent(new Date());
  };

  const handlePopoverSelect = (date: Date | undefined) => {
    if (!date) return;
    commitDateToParent(date);
  };

  const handleCreateForDay = (defaultStartTime?: string) => {
    onDateSelect(selectedDate, false, [], { defaultStartTime });
  };

  const handleCreateForWeekDay = (date: Date, defaultStartTime?: string) => {
    onDateSelect(date, false, [], { defaultStartTime });
  };

  const dateButtonLabel = isWeekMode
    ? `${format(weekStart, "MMM d")} - ${format(weekEnd, "MMM d, yyyy")}`
    : format(selectedDate, "PPP");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="outline" size="icon" onClick={handlePrevDay} aria-label="Previous day">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Popover>
          <PopoverTrigger asChild>
            <Button type="button" variant="outline" className={cn("min-w-[200px] justify-start text-left font-normal")}>
              <CalendarIcon className="text-muted-foreground mr-2 h-4 w-4" />
              {dateButtonLabel}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar mode="single" selected={selectedDate} onSelect={handlePopoverSelect} initialFocus />
          </PopoverContent>
        </Popover>
        <Button type="button" variant="outline" size="icon" onClick={handleNextDay} aria-label="Next day">
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={handleToday}>
          Today
        </Button>
        <ToggleGroup
          type="single"
          value={viewConfig.mode}
          onValueChange={(value) => {
            if (value !== "day" && value !== "week") return;
            setViewConfig({ mode: value });
          }}
          variant="outline"
        >
          <ToggleGroupItem value="week" aria-label="Week view">
            Week
          </ToggleGroupItem>
          <ToggleGroupItem value="day" aria-label="Day view">
            Day
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {isWeekMode ? (
        <SessionWeekTimetable
          selectedDate={selectedDate}
          sessions={sessions}
          isLoading={isLoading}
          onSessionSelect={onSessionSelect}
          onEditSession={onEditSession}
          onCreateForDay={handleCreateForWeekDay}
          readOnly={readOnly}
        />
      ) : (
        <SessionDayTimetable
          selectedDate={selectedDate}
          sessions={sessions}
          isLoading={isLoading}
          onSessionSelect={onSessionSelect}
          onEditSession={onEditSession}
          onCreateForDay={handleCreateForDay}
          readOnly={readOnly}
        />
      )}
    </div>
  );
}
