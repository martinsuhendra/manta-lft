import { format, parseISO } from "date-fns";

import { type MemberSession, type SessionEligibility } from "@/hooks/use-member-sessions";

import { SessionCard } from "../../_components/session-card";

import { BookDateStrip } from "./book-date-strip";

interface BookSessionsPanelProps {
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

export function BookSessionsPanel({
  daysInRange,
  dateRangeKey,
  selectedDate,
  onSelectDate,
  datesWithSessions,
  sessionsForSelected,
  bySessionId,
  onSelectSession,
  isSignedIn,
}: BookSessionsPanelProps) {
  return (
    <div className="space-y-6">
      <BookDateStrip
        allDays={daysInRange}
        rangeKey={dateRangeKey}
        selectedDate={selectedDate}
        onSelectDate={onSelectDate}
        datesWithSessions={datesWithSessions}
      />

      {selectedDate ? (
        <>
          <div className="overflow-hidden border-b pb-4">
            <div
              key={selectedDate}
              className="animate-in fade-in-0 slide-in-from-bottom-2 duration-300 motion-reduce:animate-none"
            >
              <p className="text-muted-foreground text-sm font-medium sm:text-base">
                {format(parseISO(selectedDate), "EEEE")}
              </p>
              <h3 className="text-foreground text-xl font-bold tracking-tight sm:text-2xl">
                {format(parseISO(selectedDate), "MMMM d, yyyy")}
              </h3>
            </div>
          </div>

          {sessionsForSelected.length === 0 ? (
            <p className="text-muted-foreground text-sm">No sessions on this day.</p>
          ) : (
            <div className="space-y-4">
              {sessionsForSelected.map((session) => {
                const elig = bySessionId[session.id];
                const spotsLeft = elig?.spotsLeft ?? session.spotsLeft;
                const isFull = spotsLeft <= 0;
                const actionLabel = !isSignedIn ? "Sign In" : isFull && !elig?.alreadyBooked ? "Waitlist" : "Join";

                return (
                  <SessionCard
                    key={session.id}
                    session={session}
                    eligibility={elig}
                    onCardClick={() => onSelectSession(session)}
                    actionLabel={actionLabel}
                    onActionClick={() => onSelectSession(session)}
                    actionDisabled={false}
                  />
                );
              })}
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}
