"use client";

import * as React from "react";

import Link from "next/link";

import { format, parseISO } from "date-fns";
import { ArrowRight } from "lucide-react";
import { useSession } from "next-auth/react";

import { Button } from "@/components/ui/button";
import type { MemberSession } from "@/hooks/use-member-sessions";
import { cn } from "@/lib/utils";

import { BookingModal } from "../book/_components/booking-modal";

import { SectionWithPattern } from "./section-with-pattern";
import { SessionCard } from "./session-card";
import { SessionDetailsDialog } from "./session-details-dialog";

interface UpcomingSessionsProps {
  sessions: MemberSession[];
  hideTitle?: boolean;
  showViewFullSchedule?: boolean;
  /** When true (e.g. landing page), show only today's sessions. When false (e.g. schedule page), show all sessions from filters. */
  todayOnly?: boolean;
  /**
   * All public programs (catalog). When omitted, chips are derived only from visible sessions —
   * so programs with no sessions today disappear on the homepage.
   */
  programNames?: readonly string[];
}

export function UpcomingSessions({
  sessions,
  hideTitle,
  showViewFullSchedule = true,
  todayOnly = true,
  programNames,
}: UpcomingSessionsProps) {
  const { data: authSession } = useSession();
  const [filter, setFilter] = React.useState<string>("All");
  const [selectedSession, setSelectedSession] = React.useState<MemberSession | null>(null);
  const [showDetails, setShowDetails] = React.useState(false);
  const [showBooking, setShowBooking] = React.useState(false);

  const isMember = authSession?.user.role === "MEMBER";

  const sessionsToShow = React.useMemo(() => {
    if (todayOnly) {
      const todayStr = format(new Date(), "yyyy-MM-dd");
      return sessions.filter((s) => s.date === todayStr);
    }
    return sessions;
  }, [sessions, todayOnly]);

  const handleCardClick = (session: MemberSession) => {
    setSelectedSession(session);
    setShowDetails(true);
  };

  const handleJoinClick = (e: React.MouseEvent, session: MemberSession) => {
    e.stopPropagation();
    setSelectedSession(session);
    if (isMember) {
      setShowBooking(true);
    } else {
      setShowDetails(true);
    }
  };

  const handleJoinFromDetails = (session: MemberSession) => {
    setSelectedSession(session);
    setShowDetails(false);
    setShowBooking(true);
  };

  const filterChips = React.useMemo(() => {
    const fromCatalog = programNames?.filter(Boolean).length ? Array.from(new Set(programNames.filter(Boolean))) : [];
    const fromSessions = sessionsToShow.map((s) => s.item.name);
    const names = new Set(fromCatalog.length > 0 ? fromCatalog : fromSessions);
    return ["All", ...Array.from(names).sort((a, b) => a.localeCompare(b))];
  }, [sessionsToShow, programNames]);

  const filteredSessions = React.useMemo(() => {
    if (filter === "All") return sessionsToShow;
    return sessionsToShow.filter((s) => s.item.name === filter);
  }, [filter, sessionsToShow]);

  const groupedSessions = React.useMemo(() => {
    const acc: Record<string, MemberSession[]> = {};
    for (const session of filteredSessions) {
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
  }, [filteredSessions]);

  const sortedDates = React.useMemo(() => Object.keys(groupedSessions).sort(), [groupedSessions]);

  const getSessionsForDate = React.useCallback(
    (d: string): MemberSession[] => {
      // eslint-disable-next-line security/detect-object-injection -- d is date key
      const bucket = groupedSessions[d];
      return bucket ?? []; // eslint-disable-line @typescript-eslint/no-unnecessary-condition -- Record access can be undefined
    },
    [groupedSessions],
  );

  if (todayOnly && sessionsToShow.length === 0) return null;

  return (
    <SectionWithPattern id="schedule" className="border-border bg-muted/20 sporty-section-fill border-t py-24 sm:py-32">
      <div className="container mx-auto px-4">
        {!hideTitle && (
          <div className="mx-auto mb-8 max-w-2xl text-center sm:mb-12">
            <h2 className="text-foreground text-2xl font-black tracking-tighter uppercase italic sm:text-3xl md:text-4xl md:text-5xl">
              Class Schedule
            </h2>
            <p className="text-muted-foreground mt-3 text-sm sm:mt-4 sm:text-base">
              Book your spot. First come, first served.
            </p>
          </div>
        )}

        <div className="mb-10 flex flex-wrap justify-center gap-2">
          {filterChips.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => setFilter(name)}
              className={cn(
                "rounded-full px-6 py-2 text-sm font-bold tracking-wide uppercase transition-all",
                filter === name
                  ? "bg-primary text-primary-foreground shadow-primary/20 shadow-lg"
                  : "border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground border",
              )}
            >
              {name}
            </button>
          ))}
        </div>

        {filteredSessions.length === 0 ? (
          <div className="border-border rounded-xl border border-dashed py-12 text-center">
            <p className="text-muted-foreground">No classes found for this filter.</p>
          </div>
        ) : (
          <div className={hideTitle ? "space-y-8" : "space-y-10"}>
            {sortedDates.map((date) => (
              <div key={date}>
                <div className="mb-3 flex items-center gap-3 sm:mb-4 sm:gap-4">
                  <div className="bg-primary text-primary-foreground flex flex-col items-center justify-center rounded-lg px-3 py-1.5 shadow-md sm:rounded-xl sm:px-4 sm:py-2">
                    <span className="text-[10px] font-bold uppercase sm:text-xs">{format(parseISO(date), "MMM")}</span>
                    <span className="text-xl font-black sm:text-2xl">{format(parseISO(date), "dd")}</span>
                  </div>
                  <h3 className="text-foreground truncate text-base font-bold sm:text-xl">
                    {format(parseISO(date), "EEEE")}
                  </h3>
                  <div className="bg-border h-px flex-1" />
                </div>
                <div className="space-y-4">
                  {getSessionsForDate(date).map((session) => (
                    <SessionCard
                      key={session.id}
                      session={session}
                      onCardClick={() => handleCardClick(session)}
                      actionLabel={session.spotsLeft === 0 ? "Full" : "Join Session"}
                      onActionClick={(e) => handleJoinClick(e, session)}
                      actionDisabled={session.spotsLeft === 0}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {!hideTitle && showViewFullSchedule && (
          <div className="mt-12 flex justify-center">
            <Button asChild size="lg" className="gap-2 font-bold tracking-wide uppercase">
              <Link href="/public/schedule">
                View Full Schedule
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        )}
      </div>

      <SessionDetailsDialog
        session={selectedSession}
        open={showDetails}
        onOpenChange={setShowDetails}
        onJoinSession={handleJoinFromDetails}
      />

      {isMember && (
        <BookingModal session={showBooking ? selectedSession : null} open={showBooking} onOpenChange={setShowBooking} />
      )}
    </SectionWithPattern>
  );
}
