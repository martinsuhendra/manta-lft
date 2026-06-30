"use client";

import * as React from "react";

import { Loader2 } from "lucide-react";
import { toast } from "sonner";

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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { getSessionStatusLabel } from "./schema";

type SessionStatus = "SCHEDULED" | "CANCELLED" | "COMPLETED";

interface BulkUpdateStatusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionIds: string[];
  onSuccess?: () => void;
}

export function BulkUpdateStatusDialog({ open, onOpenChange, sessionIds, onSuccess }: BulkUpdateStatusDialogProps) {
  const [status, setStatus] = React.useState<SessionStatus>("SCHEDULED");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (!open) setStatus("SCHEDULED");
  }, [open]);

  async function handleSubmit() {
    if (!sessionIds.length) {
      toast.error("No sessions selected");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/admin/sessions/bulk-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionIds,
          status,
        }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? "Failed to update session status");
      }

      const statusLabel = getSessionStatusLabel(status);
      toast.success(`Updated ${sessionIds.length} session(s) to ${statusLabel}`);
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update session status");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={isSubmitting ? () => {} : onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Bulk Update Status</DialogTitle>
          <DialogDescription>
            Change status for {sessionIds.length} selected session{sessionIds.length !== 1 ? "s" : ""}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-2">
          <Label htmlFor="bulk-session-status">Session Status</Label>
          <Select value={status} onValueChange={(value) => setStatus(value as SessionStatus)}>
            <SelectTrigger id="bulk-session-status">
              <SelectValue placeholder="Select session status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="SCHEDULED">{getSessionStatusLabel("SCHEDULED")}</SelectItem>
              <SelectItem value="CANCELLED">{getSessionStatusLabel("CANCELLED")}</SelectItem>
              <SelectItem value="COMPLETED">{getSessionStatusLabel("COMPLETED")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <DialogFooter>
          <Button variant="outline" disabled={isSubmitting} onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={isSubmitting || !sessionIds.length} onClick={handleSubmit}>
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {isSubmitting ? "Updating..." : "Update Status"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
