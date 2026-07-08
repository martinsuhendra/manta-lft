"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

import {
  Dialog,
  PublicDialogBody,
  PublicDialogContent,
  PublicDialogDescription,
  PublicDialogFooter,
  PublicDialogHeader,
  PublicDialogTitle,
} from "./public-dialog";

interface PublicWaiverResponse {
  contentHtml: string;
  version: number;
  isActive: boolean;
}

interface SignUpWaiverDialogProps {
  open: boolean;
  isLoading: boolean;
  waiver: PublicWaiverResponse | null;
  isWaiverConfirmed: boolean;
  onOpenChange: (open: boolean) => void;
  onWaiverConfirmedChange: (confirmed: boolean) => void;
  onBack: () => void;
  onConfirm: () => void;
}

export function SignUpWaiverDialog({
  open,
  isLoading,
  waiver,
  isWaiverConfirmed,
  onOpenChange,
  onWaiverConfirmedChange,
  onBack,
  onConfirm,
}: SignUpWaiverDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <PublicDialogContent className="max-w-2xl">
        <PublicDialogHeader>
          <PublicDialogTitle>Waiver and release of liability</PublicDialogTitle>
          <PublicDialogDescription>
            Please review and agree to the waiver to complete your registration.
          </PublicDialogDescription>
        </PublicDialogHeader>

        <PublicDialogBody className="space-y-4">
          <div className="max-h-[55vh] overflow-y-auto rounded-md border p-4">
            <div className="prose prose-sm max-w-none">
              <div dangerouslySetInnerHTML={{ __html: waiver?.contentHtml ?? "" }} />
            </div>
          </div>

          <div className="rounded-md border p-3">
            <label className="flex cursor-pointer items-start gap-3 text-sm">
              <Checkbox
                checked={isWaiverConfirmed}
                onCheckedChange={(value) => onWaiverConfirmedChange(Boolean(value))}
                className="data-[state=checked]:border-brand-primary data-[state=checked]:bg-brand-primary dark:data-[state=checked]:bg-brand-primary"
              />
              <span>I have read this waiver and voluntarily agree to its terms.</span>
            </label>
          </div>
        </PublicDialogBody>

        <PublicDialogFooter>
          <Button type="button" variant="outline" onClick={onBack} disabled={isLoading}>
            Back
          </Button>
          <Button type="button" onClick={onConfirm} disabled={isLoading || !isWaiverConfirmed}>
            {isLoading ? "Creating account..." : "Agree and create account"}
          </Button>
        </PublicDialogFooter>
      </PublicDialogContent>
    </Dialog>
  );
}
