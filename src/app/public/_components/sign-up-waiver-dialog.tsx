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

interface PublicWaiverItem {
  id: string;
  name: string;
  contentHtml: string;
  version: number;
  isActive: boolean;
}

interface SignUpWaiverDialogProps {
  open: boolean;
  isLoading: boolean;
  waivers: PublicWaiverItem[];
  isWaiverConfirmed: boolean;
  onOpenChange: (open: boolean) => void;
  onWaiverConfirmedChange: (confirmed: boolean) => void;
  onBack: () => void;
  onConfirm: () => void;
}

export function SignUpWaiverDialog({
  open,
  isLoading,
  waivers,
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
            Please review and agree to {waivers.length > 1 ? "all waivers" : "the waiver"} to complete your
            registration.
          </PublicDialogDescription>
        </PublicDialogHeader>

        <PublicDialogBody className="space-y-4">
          {waivers.map((waiver) => (
            <div key={waiver.id} className="space-y-2">
              {waivers.length > 1 ? <h3 className="text-sm font-semibold">{waiver.name}</h3> : null}
              <div className="max-h-[40vh] overflow-y-auto rounded-md border p-4">
                <div className="prose prose-sm max-w-none">
                  <div dangerouslySetInnerHTML={{ __html: waiver.contentHtml }} />
                </div>
              </div>
            </div>
          ))}

          <div className="rounded-md border p-3">
            <label className="flex cursor-pointer items-start gap-3 text-sm">
              <Checkbox
                checked={isWaiverConfirmed}
                onCheckedChange={(value) => onWaiverConfirmedChange(Boolean(value))}
                className="data-[state=checked]:border-brand-primary data-[state=checked]:bg-brand-primary dark:data-[state=checked]:bg-brand-primary"
              />
              <span>
                I have read {waivers.length > 1 ? "these waivers" : "this waiver"} and voluntarily agree to their terms.
              </span>
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
