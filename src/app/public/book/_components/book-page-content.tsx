"use client";

import { useEffect, useMemo, useState } from "react";

import { addDays, eachDayOfInterval, format, parseISO, startOfDay } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useSession } from "next-auth/react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useMemberSessions,
  useSessionEligibilityBatch,
  type MemberSession,
  type SessionEligibility,
} from "@/hooks/use-member-sessions";
import { cn } from "@/lib/utils";

import { SignInDialog } from "../../_components/sign-in-dialog";

import { BookSessionsPanel } from "./book-sessions-panel";
import { BookingModal } from "./booking-modal";

const defaultStart = startOfDay(new Date());
const RANGE_DAYS = 14;

const datePickerButtonClass =
  "border-border bg-background text-foreground h-10 min-w-[140px] justify-start text-left font-normal shadow-xs sm:w-[180px]";

interface ClassOption {
  id: string;
  name: string;
}

interface BookPageContentProps {
  classes: ClassOption[];
  initialItemId?: string;
}

interface SessionsResultProps {
  isLoading: boolean;
  hasSessions: boolean;
  daysInRange: string[];
  dateRangeKey: string;
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
  datesWithSessions: Set<string>;
  sessionsForSelected: MemberSession[];
  bySessionId: Record<string, SessionEligibility | undefined>;
  onSelectSession: (session: MemberSession) => void;
  isSignedIn: boolean;
}

function getSessionsOnDate(byDate: Record<string, MemberSession[]>, dateKey: string): MemberSession[] {
  if (!Object.prototype.hasOwnProperty.call(byDate, dateKey)) return [];
  // eslint-disable-next-line security/detect-object-injection -- dateKey validated via hasOwnProperty
  return byDate[dateKey];
}

function SessionsResult({
  isLoading,
  hasSessions,
  daysInRange,
  dateRangeKey,
  selectedDate,
  onSelectDate,
  datesWithSessions,
  sessionsForSelected,
  bySessionId,
  onSelectSession,
  isSignedIn,
}: SessionsResultProps) {
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Skeleton className="size-9 shrink-0 rounded-full" />
          <div className="flex min-w-0 flex-1 gap-2 overflow-hidden py-1">
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <Skeleton key={i} className="h-[4.25rem] min-w-[3.25rem] shrink-0 rounded-xl sm:min-w-[3.75rem]" />
            ))}
          </div>
          <Skeleton className="size-9 shrink-0 rounded-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-9 w-full max-w-xs" />
        </div>
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  if (!hasSessions) {
    return (
      <div className="text-muted-foreground rounded-lg border border-dashed p-8 text-center">
        <p>No sessions in this date range.</p>
        <p className="mt-1 text-sm">Try adjusting the date range above.</p>
      </div>
    );
  }

  return (
    <BookSessionsPanel
      daysInRange={daysInRange}
      dateRangeKey={dateRangeKey}
      selectedDate={selectedDate}
      onSelectDate={onSelectDate}
      datesWithSessions={datesWithSessions}
      sessionsForSelected={sessionsForSelected}
      bySessionId={bySessionId}
      onSelectSession={onSelectSession}
      isSignedIn={isSignedIn}
    />
  );
}

export function BookPageContent({ classes, initialItemId }: BookPageContentProps) {
  const [startDate, setStartDate] = useState(() => format(defaultStart, "yyyy-MM-dd"));
  const endDate = useMemo(() => format(addDays(parseISO(startDate), RANGE_DAYS), "yyyy-MM-dd"), [startDate]);
  const [itemId, setItemId] = useState<string>(() => initialItemId ?? "");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSession, setSelectedSession] = useState<MemberSession | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [signInOpen, setSignInOpen] = useState(false);
  const { data: authSession } = useSession();
  const isSignedIn = Boolean(authSession?.user);

  useEffect(() => {
    setItemId(initialItemId ?? "");
  }, [initialItemId]);

  const filters = useMemo(() => ({ startDate, endDate, itemId: itemId || undefined }), [startDate, endDate, itemId]);
  const { data: sessions = [], isLoading } = useMemberSessions(filters);

  const sortedSessionsFlat = useMemo(
    () =>
      [...sessions].sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return a.startTime.localeCompare(b.startTime);
      }),
    [sessions],
  );

  const rangeStart = startDate <= endDate ? startDate : endDate;
  const rangeEnd = startDate <= endDate ? endDate : startDate;

  const daysInRange = useMemo(() => {
    const start = parseISO(rangeStart);
    const end = parseISO(rangeEnd);
    return eachDayOfInterval({ start, end }).map((d) => format(d, "yyyy-MM-dd"));
  }, [rangeStart, rangeEnd]);

  const sessionsByDate = useMemo(() => {
    const acc: Record<string, MemberSession[]> = {};
    for (const session of sortedSessionsFlat) {
      const dateKey = session.date;
      // eslint-disable-next-line security/detect-object-injection -- dateKey is session.date
      const bucket = acc[dateKey];
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- bucket is undefined until set
      if (!bucket) {
        // eslint-disable-next-line security/detect-object-injection -- dateKey is session.date
        acc[dateKey] = [session];
      } else bucket.push(session);
    }
    return acc;
  }, [sortedSessionsFlat]);

  const datesWithSessions = useMemo(() => new Set(Object.keys(sessionsByDate)), [sessionsByDate]);

  useEffect(() => {
    if (daysInRange.length === 0) {
      setSelectedDate(null);
      return;
    }
    setSelectedDate(daysInRange[0]);
  }, [startDate, daysInRange]);

  useEffect(() => {
    if (daysInRange.length === 0) return;
    setSelectedDate((prev) => {
      if (prev && daysInRange.includes(prev)) return prev;
      const firstWithSessions = daysInRange.find((d) => getSessionsOnDate(sessionsByDate, d).length > 0);
      return firstWithSessions ?? daysInRange[0];
    });
    // Only re-anchor when session data loads, not when the user changes the date filter.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- daysInRange read from closure
  }, [sessionsByDate]);

  const sessionsForSelected = useMemo(
    () => (selectedDate ? getSessionsOnDate(sessionsByDate, selectedDate) : []),
    [selectedDate, sessionsByDate],
  );

  const sessionIds = useMemo(() => sessionsForSelected.map((s) => s.id), [sessionsForSelected]);
  const { bySessionId } = useSessionEligibilityBatch(sessionIds, sessionIds.length > 0 && isSignedIn);

  const handleSelectSession = (s: MemberSession) => {
    if (!isSignedIn) {
      setSignInOpen(true);
      return;
    }
    setSelectedSession(s);
    setModalOpen(true);
  };

  const applyStartDate = (date: Date) => {
    const formatted = format(date, "yyyy-MM-dd");
    setStartDate(formatted);
    setSelectedDate(formatted);
  };

  const startDateObj = startDate ? new Date(startDate + "T00:00:00") : undefined;
  const endDateObj = endDate ? new Date(endDate + "T00:00:00") : undefined;

  return (
    <div className="container mx-auto max-w-4xl px-4 py-6 sm:py-8">
      <section className="mb-6 sm:mb-8">
        <h2 className="text-xl font-bold sm:text-2xl">Book a class</h2>
        <p className="text-muted-foreground mt-1 text-sm sm:text-base">
          Browse upcoming sessions and book based on your membership.
        </p>
        {!isSignedIn ? (
          <p className="text-muted-foreground mt-2 text-sm">
            Sign in to book classes. You can still browse all sessions.
          </p>
        ) : null}
      </section>

      <section className="mb-6 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="flex flex-wrap items-center gap-2">
          <Label className="text-muted-foreground text-sm" htmlFor="start">
            From
          </Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button id="start" variant="outline" className={cn(datePickerButtonClass, !startDate && "opacity-90")}>
                <CalendarIcon className="text-brand-primary mr-2 h-4 w-4 shrink-0" />
                {startDateObj ? format(startDateObj, "MMM d, yyyy") : "Pick date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={startDateObj}
                onSelect={(date) => date && applyStartDate(date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Label className="text-muted-foreground text-sm" htmlFor="end">
            To
          </Label>
          <Button
            id="end"
            variant="outline"
            disabled
            aria-disabled
            className={cn(datePickerButtonClass, "disabled:opacity-70")}
          >
            <CalendarIcon className="text-brand-primary mr-2 h-4 w-4 shrink-0" />
            {endDateObj ? format(endDateObj, "MMM d, yyyy") : "—"}
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Label className="text-muted-foreground text-sm" htmlFor="class">
            Class
          </Label>
          <Select value={itemId || "all"} onValueChange={(v) => setItemId(v === "all" ? "" : v)}>
            <SelectTrigger id="class" className="w-full min-w-0 sm:w-[180px]">
              <SelectValue placeholder="All classes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All classes</SelectItem>
              {classes.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </section>

      <SessionsResult
        isLoading={isLoading}
        hasSessions={sortedSessionsFlat.length > 0}
        daysInRange={daysInRange}
        dateRangeKey={`${rangeStart}|${rangeEnd}`}
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        datesWithSessions={datesWithSessions}
        sessionsForSelected={sessionsForSelected}
        bySessionId={bySessionId}
        onSelectSession={handleSelectSession}
        isSignedIn={isSignedIn}
      />

      <BookingModal session={selectedSession} open={modalOpen} onOpenChange={setModalOpen} />
      <SignInDialog open={signInOpen} onOpenChange={setSignInOpen} />
    </div>
  );
}
