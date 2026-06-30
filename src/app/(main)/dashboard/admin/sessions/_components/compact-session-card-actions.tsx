"use client";

import { Edit2, Trash2, UserCircle2, UserPlus, Users as UsersIcon, MoreHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Session } from "./schema";

interface CompactSessionCardActionsProps {
  session: Session;
  hasParticipants: boolean;
  onEdit?: (session: Session) => void;
  onAddParticipant: () => void;
  onViewParticipants: () => void;
  onStatusUpdate: (sessionId: string, status: "SCHEDULED" | "CANCELLED" | "COMPLETED") => void;
  onCancelClick: (session: Session) => void;
  onDeleteClick: (session: Session) => void;
  onAssignTeacher?: () => void;
  /** When true, shows icon-only button (for table rows) */
  compact?: boolean;
}

export function CompactSessionCardActions({
  session,
  onEdit,
  onAddParticipant,
  onViewParticipants,
  onStatusUpdate,
  onDeleteClick,
  onAssignTeacher,
  compact = false,
}: CompactSessionCardActionsProps) {
  return (
    <div className={compact ? "flex justify-end" : "flex items-center justify-end pt-2"}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant={compact ? "ghost" : "outline"}
            size={compact ? "icon" : "sm"}
            onClick={(e) => e.stopPropagation()}
            className={compact ? "h-8 w-8" : "h-8"}
          >
            <MoreHorizontal className={compact ? "h-4 w-4" : "mr-1 h-3.5 w-3.5"} />
            {!compact && "Actions"}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel className="text-sm">Session Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />

          {onEdit && (
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onEdit(session);
              }}
              className="cursor-pointer text-sm"
            >
              <Edit2 className="mr-2 h-3.5 w-3.5" />
              Edit Session
            </DropdownMenuItem>
          )}

          {onAssignTeacher && (
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onAssignTeacher();
              }}
              className="cursor-pointer text-sm"
            >
              <UserCircle2 className="mr-2 h-3.5 w-3.5" />
              Assign Teacher
            </DropdownMenuItem>
          )}

          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              onAddParticipant();
            }}
            className="cursor-pointer text-sm"
          >
            <UserPlus className="mr-2 h-3.5 w-3.5" />
            Add Participant
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              onViewParticipants();
            }}
            className="cursor-pointer text-sm"
          >
            <UsersIcon className="mr-2 h-3.5 w-3.5" />
            View Participants
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* Status Updates */}
          {session.status !== "SCHEDULED" && (
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onStatusUpdate(session.id, "SCHEDULED");
              }}
              className="cursor-pointer text-sm"
            >
              Mark as Scheduled
            </DropdownMenuItem>
          )}

          {session.status !== "CANCELLED" && (
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onStatusUpdate(session.id, "CANCELLED");
              }}
              className="cursor-pointer text-sm"
            >
              Cancel Session
            </DropdownMenuItem>
          )}

          {session.status !== "COMPLETED" && (
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onStatusUpdate(session.id, "COMPLETED");
              }}
              className="cursor-pointer text-sm"
            >
              Mark as Completed
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator />

          <DropdownMenuItem
            variant="destructive"
            className="cursor-pointer text-sm"
            onClick={(e) => {
              e.stopPropagation();
              onDeleteClick(session);
            }}
          >
            <Trash2 className="mr-2 h-3.5 w-3.5" />
            Delete Session
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
