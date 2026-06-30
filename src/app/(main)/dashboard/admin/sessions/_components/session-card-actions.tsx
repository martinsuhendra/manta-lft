"use client";

import { Edit, MoreHorizontal, Trash2, UserPlus, Users as UsersIcon } from "lucide-react";

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

interface SessionCardActionsProps {
  session: Session;
  hasParticipants: boolean;
  onEdit?: (session: Session) => void;
  onAddParticipant: () => void;
  onViewParticipants: () => void;
  onStatusUpdate: (sessionId: string, status: "SCHEDULED" | "CANCELLED" | "COMPLETED") => void;
  onCancelClick: (session: Session) => void;
  onDeleteClick: (session: Session) => void;
}

export function SessionCardActions({
  session,
  onEdit,
  onAddParticipant,
  onViewParticipants,
  onStatusUpdate,
  onCancelClick,
  onDeleteClick,
}: SessionCardActionsProps) {
  return (
    <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="hover:bg-muted h-7 w-7 p-0">
            <MoreHorizontal className="h-3.5 w-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel className="text-sm">Session Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />

          {onEdit && (
            <DropdownMenuItem onClick={() => onEdit(session)} className="cursor-pointer text-sm">
              <Edit className="mr-2 h-3.5 w-3.5" />
              Edit Session
            </DropdownMenuItem>
          )}

          <DropdownMenuItem onClick={onAddParticipant} className="cursor-pointer text-sm">
            <UserPlus className="mr-2 h-3.5 w-3.5" />
            Add Participant
          </DropdownMenuItem>

          <DropdownMenuItem onClick={onViewParticipants} className="cursor-pointer text-sm">
            <UsersIcon className="mr-2 h-3.5 w-3.5" />
            View Participants
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* Status Updates */}
          {session.status !== "SCHEDULED" && (
            <DropdownMenuItem
              onClick={() => onStatusUpdate(session.id, "SCHEDULED")}
              className="cursor-pointer text-sm"
            >
              Mark as Scheduled
            </DropdownMenuItem>
          )}

          {session.status !== "CANCELLED" && (
            <DropdownMenuItem onClick={() => onCancelClick(session)} className="cursor-pointer text-sm">
              Cancel Session
            </DropdownMenuItem>
          )}

          {session.status !== "COMPLETED" && (
            <DropdownMenuItem
              onClick={() => onStatusUpdate(session.id, "COMPLETED")}
              className="cursor-pointer text-sm"
            >
              Mark as Completed
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator />

          <DropdownMenuItem
            variant="destructive"
            className="cursor-pointer text-sm"
            onClick={() => onDeleteClick(session)}
          >
            <Trash2 className="mr-2 h-3.5 w-3.5" />
            Delete Session
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
