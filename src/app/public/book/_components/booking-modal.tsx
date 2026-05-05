/* eslint-disable complexity, @typescript-eslint/no-unnecessary-condition */
"use client";

import { useState, useEffect } from "react";

import { format } from "date-fns";
import { CheckCircle, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useAcceptMemberWaiver,
  useMemberBookSession,
  useMemberCancelBooking,
  useMemberWaiver,
  useSessionEligibility,
  type MemberSession,
} from "@/hooks/use-member-sessions";

interface BookingModalProps {
  session: MemberSession | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BookingModal({ session, open, onOpenChange }: BookingModalProps) {
  const [selectedMembershipId, setSelectedMembershipId] = useState<string>("");
  const { data: eligibility, isLoading: eligibilityLoading } = useSessionEligibility(
    session?.id ?? null,
    open && !!session?.id,
  );
  const { data: waiverData, isLoading: waiverLoading } = useMemberWaiver(open && !!session?.id);
  const acceptWaiverMutation = useAcceptMemberWaiver();
  const bookMutation = useMemberBookSession();
  const cancelMutation = useMemberCancelBooking();

  // When eligibility loads or session changes, ensure a valid membership is selected
  useEffect(() => {
    const list = eligibility?.eligibleMemberships ?? [];
    if (!list.length) {
      setSelectedMembershipId("");
      return;
    }
    setSelectedMembershipId((prev) => {
      const ids = list.map((m) => m.id);
      return prev && ids.includes(prev) ? prev : list[0].id;
    });
  }, [eligibility?.eligibleMemberships, session?.id]);

  const handleBook = () => {
    if (!session || !eligibility?.canJoin) return;
    const mid = selectedMembershipId;
    if (!mid) return;
    bookMutation.mutate(
      { sessionId: session.id, membershipId: mid },
      {
        onSuccess: () => {
          onOpenChange(false);
          setSelectedMembershipId("");
        },
      },
    );
  };

  const handleCancelBooking = () => {
    if (!eligibility?.bookingId) return;
    cancelMutation.mutate(eligibility.bookingId, {
      onSuccess: () => {
        onOpenChange(false);
      },
    });
  };

  const handleAcceptWaiver = () => {
    const version = waiverData?.waiver.version;
    if (!version) return;
    acceptWaiverMutation.mutate(version);
  };

  if (!session) return null;

  const spotsLeft = eligibility && eligibility.spotsLeft != null ? eligibility.spotsLeft : (session.spotsLeft ?? 0);
  const selectedMembership = eligibility?.eligibleMemberships.find((m) => m.id === selectedMembershipId);
  const selectedFits = selectedMembership ? spotsLeft >= selectedMembership.slotsRequired : false;
  const needsWaiverAcceptance = waiverData?.waiver.isActive && !waiverData.hasAccepted;
  const canBook = eligibility?.canJoin && !needsWaiverAcceptance && !!selectedMembershipId && selectedFits;
  const isPending = bookMutation.isPending || cancelMutation.isPending || acceptWaiverMutation.isPending;

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        onOpenChange(open);
        if (!open) setSelectedMembershipId("");
      }}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{session.item.name}</DialogTitle>
          <DialogDescription>
            {format(new Date(session.date), "EEEE, MMMM d, yyyy")} · {session.startTime}
            {session.endTime ? ` – ${session.endTime}` : ""}
            {session.teacher && <> · {session.teacher.name ?? session.teacher.email ?? "—"}</>}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {eligibilityLoading || waiverLoading ? (
            <Skeleton className="h-24 w-full" />
          ) : needsWaiverAcceptance ? (
            <div className="space-y-3">
              <p className="text-muted-foreground text-sm">
                You need to accept the waiver before you can book this session.
              </p>
              <div className="max-h-64 overflow-y-auto rounded-md border p-3 text-sm">
                <div dangerouslySetInnerHTML={{ __html: waiverData.waiver.contentHtml }} />
              </div>
              <Button className="w-full" onClick={handleAcceptWaiver} disabled={isPending}>
                {acceptWaiverMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Accept waiver
              </Button>
            </div>
          ) : eligibility?.alreadyBooked ? (
            <div className="bg-muted/50 rounded-lg border p-4">
              <p className="text-muted-foreground text-sm">
                {eligibility.canCancel === false
                  ? "Cancellation is no longer allowed for this session."
                  : eligibility.cancelDeadline
                    ? `You're booked for this class. You can cancel until ${format(new Date(eligibility.cancelDeadline), "PPp")}.`
                    : "You're booked for this class. You can cancel your booking below."}
              </p>
              <Button
                variant="destructive"
                size="sm"
                className="mt-3"
                onClick={handleCancelBooking}
                disabled={isPending || eligibility.canCancel === false}
              >
                {cancelMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Cancel booking
              </Button>
            </div>
          ) : eligibility?.canJoin ? (
            <div className="space-y-3">
              <Label>Choose which membership to use</Label>
              <RadioGroup value={selectedMembershipId} onValueChange={setSelectedMembershipId}>
                {eligibility.eligibleMemberships.map((m) => {
                  const fits = spotsLeft >= m.slotsRequired;
                  return (
                    <div
                      key={m.id}
                      className={`border-input flex items-start space-x-3 rounded-lg border p-3 ${!fits ? "opacity-70" : ""}`}
                    >
                      <RadioGroupItem value={m.id} id={m.id} className="mt-1" disabled={!fits} />
                      <div className="flex-1">
                        <Label
                          htmlFor={m.id}
                          className={`cursor-pointer font-medium ${!fits ? "cursor-not-allowed" : ""}`}
                        >
                          {m.product.name}
                        </Label>
                        {m.slotsRequired > 1 && (
                          <p className="text-muted-foreground my-1 text-xs">Uses {m.slotsRequired} spots</p>
                        )}
                        <p className="text-muted-foreground text-xs">
                          {m.remainingQuota === null ? "Unlimited" : `${m.remainingQuota} sessions remaining`}
                        </p>
                        {!fits && (
                          <p className="text-destructive text-xs">
                            Only {spotsLeft} spot(s) left; this membership needs {m.slotsRequired}
                          </p>
                        )}
                      </div>
                      {fits && <CheckCircle className="h-4 w-4 shrink-0 text-green-600" />}
                    </div>
                  );
                })}
              </RadioGroup>
              <Button className="w-full" onClick={handleBook} disabled={!canBook || isPending}>
                {bookMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Book class
              </Button>
            </div>
          ) : (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/50">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                {eligibility?.reason ?? "You cannot book this class."}
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
