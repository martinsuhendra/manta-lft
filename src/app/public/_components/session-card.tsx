"use client";

import { format, parseISO } from "date-fns";
import { User, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { MemberSession, SessionEligibility } from "@/hooks/use-member-sessions";

const SESSION_CARD_IMAGES = [
  "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&q=80",
] as const;

function formatTimeWithAmPm(timeStr: string): string {
  try {
    const [hours] = timeStr.split(":").map(Number);
    const period = hours < 12 ? "AM" : "PM";
    const h = hours % 12 || 12;
    const mins = timeStr.includes(":") ? (timeStr.split(":")[1]?.slice(0, 2) ?? "00") : "00";
    return `${h}:${mins} ${period}`;
  } catch {
    return timeStr;
  }
}

function StatusBadge({ status }: { status: "booked" | "can-join" | "cannot-join" }) {
  const config =
    status === "booked"
      ? { label: "Already booked", className: "bg-blue-500/20 text-blue-700 dark:text-blue-300" }
      : status === "can-join"
        ? { label: "Can join", className: "bg-green-500/20 text-green-700 dark:text-green-300" }
        : { label: "Cannot join", className: "bg-muted text-muted-foreground" };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  );
}

export interface SessionCardProps {
  session: MemberSession;
  onCardClick?: () => void;
  actionLabel: string;
  onActionClick: (e: React.MouseEvent) => void;
  actionDisabled?: boolean;
  eligibility?: SessionEligibility;
}

export function SessionCard({
  session,
  onCardClick,
  actionLabel,
  onActionClick,
  actionDisabled = false,
  eligibility,
}: SessionCardProps) {
  const status = eligibility?.alreadyBooked ? "booked" : eligibility?.canJoin ? "can-join" : "cannot-join";
  const reason = eligibility?.reason;

  return (
    <Card
      className="group border-border bg-card/90 hover:border-primary/50 hover:shadow-primary/5 relative cursor-pointer overflow-hidden transition-all hover:shadow-lg"
      onClick={onCardClick}
    >
      <div className="absolute inset-0 z-0">
        {/* eslint-disable-next-line @next/next/no-img-element -- decorative session card image */}
        <img
          src={SESSION_CARD_IMAGES[session.item.name.length % SESSION_CARD_IMAGES.length]}
          alt=""
          className="h-full w-full object-cover opacity-[0.08]"
        />
        <div className="from-background/95 via-background/85 absolute inset-0 bg-gradient-to-r to-transparent" />
      </div>
      <CardContent className="relative z-10 p-0">
        <div className="flex flex-col gap-4 p-4 sm:p-6 md:flex-row md:items-center md:justify-between">
          <div className="flex min-w-0 flex-1 items-start gap-3 sm:gap-4">
            <div
              className="bg-primary/30 group-hover:bg-primary h-12 w-1 shrink-0 rounded-full transition-colors"
              style={session.item.color ? { backgroundColor: session.item.color } : undefined}
            />
            <div>
              <span className="text-foreground block text-xl font-black sm:text-2xl">
                {formatTimeWithAmPm(session.startTime)}
              </span>
              <span className="text-muted-foreground text-sm font-bold uppercase">
                {format(parseISO(session.date), "EEE")}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-foreground group-hover:text-primary text-lg font-bold transition-colors sm:text-xl">
                {session.item.name}
              </h3>
              <div className="text-muted-foreground mt-1 flex flex-wrap items-center gap-4 text-sm">
                {session.teacher && (
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {session.teacher.name ?? "TBA"}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {session.spotsLeft} spots left
                </span>
                {session.spotsLeft <= 3 && session.spotsLeft > 0 && (
                  <span className="text-destructive text-xs font-medium">Almost full</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex w-full shrink-0 flex-row items-center justify-between gap-3 sm:w-auto md:w-auto">
            {eligibility != null &&
              (reason ? (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="shrink-0">
                        <StatusBadge status={status} />
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">{reason}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : (
                <StatusBadge status={status} />
              ))}
            <Button
              size="lg"
              className="min-w-[100px] shrink-0 text-base font-black tracking-wide uppercase sm:min-w-[120px]"
              onClick={(e) => {
                e.stopPropagation();
                onActionClick(e);
              }}
              disabled={actionDisabled}
            >
              {actionLabel}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
