"use client";

import * as React from "react";

import { useRouter } from "next/navigation";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import {
  requestFreezeSchema,
  type RequestFreezeForm,
} from "@/app/(main)/dashboard/admin/freeze-requests/_components/freeze-requests-schema";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FREEZE_REASON, FREEZE_REASON_LABELS } from "@/lib/constants/freeze";

interface RequestFreezeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  membershipId: string;
  productName: string;
}

export function RequestFreezeDialog({ open, onOpenChange, membershipId, productName }: RequestFreezeDialogProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<RequestFreezeForm>({
    resolver: zodResolver(requestFreezeSchema),
    defaultValues: {
      membershipId,
      reason: FREEZE_REASON.MEDICAL,
      reasonDetails: "",
    },
  });

  React.useEffect(() => {
    if (open) {
      form.reset({
        membershipId,
        reason: FREEZE_REASON.MEDICAL,
        reasonDetails: "",
      });
    }
  }, [open, membershipId, form]);

  const onSubmit = async (data: RequestFreezeForm) => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/freeze-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error || "Failed to submit freeze request");
        return;
      }

      toast.success("Freeze request submitted. An admin will review it shortly.");
      onOpenChange(false);
      router.refresh();
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Request Membership Freeze</DialogTitle>
          <DialogDescription>
            Request a temporary freeze for your {productName} membership. You can choose medical or personal reasons. An
            admin will review and approve your request.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select reason" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={FREEZE_REASON.MEDICAL}>
                        {FREEZE_REASON_LABELS[FREEZE_REASON.MEDICAL]}
                      </SelectItem>
                      <SelectItem value={FREEZE_REASON.PERSONAL}>
                        {FREEZE_REASON_LABELS[FREEZE_REASON.PERSONAL]}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="reasonDetails"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Details (optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Provide any additional context..." className="min-h-[80px]" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Submit Request"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
