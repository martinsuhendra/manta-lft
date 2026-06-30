"use client";

import * as React from "react";

import { format } from "date-fns";
import { Clock, User, Users } from "lucide-react";
import { useSession } from "next-auth/react";

import { Button } from "@/components/ui/button";
import type { MemberSession } from "@/hooks/use-member-sessions";

import {
  Dialog,
  PublicDialogBody,
  PublicDialogContent,
  PublicDialogDescription,
  PublicDialogFooter,
  PublicDialogHeader,
  PublicDialogTitle,
} from "../_components/public-dialog";

import { SignInDialog } from "./sign-in-dialog";
import { SignUpDialog } from "./sign-up-dialog";

interface SessionDetailsDialogProps {
  session: MemberSession | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onJoinSession?: (session: MemberSession) => void;
}

export function SessionDetailsDialog({ session, open, onOpenChange, onJoinSession }: SessionDetailsDialogProps) {
  const { data: authSession, status } = useSession();

  const handleJoinClick = () => {
    if (status === "loading" || !session) return;
    if (authSession?.user.role === "MEMBER") {
      onJoinSession?.(session);
      onOpenChange(false);
    }
  };

  if (!session) return null;

  const isMember = authSession?.user.role === "MEMBER";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <PublicDialogContent className="max-w-md">
        <PublicDialogHeader className="relative">
          <div
            className="absolute top-0 right-0 left-0 h-1"
            style={{ backgroundColor: session.item.color || "#ef5f18" }}
          />
          <PublicDialogTitle className="pt-2">{session.item.name}</PublicDialogTitle>
          <PublicDialogDescription>
            {format(new Date(session.date), "EEEE, MMMM d, yyyy")} · {session.startTime}
            {session.endTime ? ` – ${session.endTime}` : ""}
          </PublicDialogDescription>
        </PublicDialogHeader>

        <PublicDialogBody>
          <div className="space-y-3">
            {session.teacher && (
              <div className="flex items-center gap-2 text-sm">
                <User className="text-brand-accent/50 h-4 w-4" />
                <span>{session.teacher.name ?? session.teacher.email ?? "Coach"}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm">
              <Users className="text-brand-accent/50 h-4 w-4" />
              <span>
                {session.spotsLeft} of {session.capacity} spots left
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="text-brand-accent/50 h-4 w-4" />
              <span>
                {session.startTime} – {session.endTime}
              </span>
            </div>
          </div>
        </PublicDialogBody>

        <PublicDialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {!authSession?.user ? (
            <>
              <SignInDialog>
                <Button variant="ghost" size="sm" className="text-white hover:bg-white/10 hover:text-white">
                  Sign In
                </Button>
              </SignInDialog>
              <SignUpDialog>
                <Button>Join Session</Button>
              </SignUpDialog>
            </>
          ) : isMember ? (
            <Button onClick={handleJoinClick}>Join Session</Button>
          ) : (
            <Button asChild>
              <a href="/public">View Memberships</a>
            </Button>
          )}
        </PublicDialogFooter>
      </PublicDialogContent>
    </Dialog>
  );
}
