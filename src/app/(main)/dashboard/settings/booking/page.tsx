"use client";

import { useEffect } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { RoleGuard } from "@/components/role-guard";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { USER_ROLES } from "@/lib/types";
import { useBrandStore } from "@/stores/brand/brand-provider";

const formSchema = z.object({
  endBookingPeriodHours: z.coerce.number().int().min(0).max(720),
  cancellationDeadlineHours: z.coerce.number().int().min(0).max(720),
});

type FormValues = z.infer<typeof formSchema>;

export default function BookingSettingsPage() {
  const queryClient = useQueryClient();
  const activeBrandId = useBrandStore((s) => s.activeBrandId);
  const selectedBrandId = activeBrandId && activeBrandId !== "ALL" ? activeBrandId : null;

  const { data: settings, isLoading: loadingSettings } = useQuery({
    queryKey: ["admin-booking-settings", selectedBrandId],
    queryFn: async () => {
      if (!selectedBrandId) throw new Error("Select a single brand to view booking settings");
      const res = await fetch("/api/admin/booking-settings", {
        headers: {
          "x-brand-id": selectedBrandId,
        },
      });
      if (!res.ok) throw new Error("Failed to load settings");
      return res.json() as Promise<{ endBookingPeriodHours: number; cancellationDeadlineHours: number }>;
    },
    enabled: Boolean(selectedBrandId),
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      endBookingPeriodHours: 0,
      cancellationDeadlineHours: 24,
    },
  });

  useEffect(() => {
    if (!settings) return;
    form.reset({
      endBookingPeriodHours: settings.endBookingPeriodHours,
      cancellationDeadlineHours: settings.cancellationDeadlineHours,
    });
  }, [form, settings]);

  const updateMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      if (!selectedBrandId) throw new Error("Select a single brand to update booking settings");
      const res = await fetch("/api/admin/booking-settings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-brand-id": selectedBrandId,
        },
        body: JSON.stringify(values),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error ?? "Failed to save settings");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-booking-settings", selectedBrandId] });
      toast.success("Booking settings saved");
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  function onSubmit(values: FormValues) {
    updateMutation.mutate(values);
  }

  return (
    <RoleGuard allowedRoles={[USER_ROLES.ADMIN, USER_ROLES.SUPERADMIN, USER_ROLES.DEVELOPER]}>
      <div className="@container/main flex flex-col gap-4 md:gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold tracking-tight">Booking settings</h1>
          <p className="text-muted-foreground">
            Configure when members can book and cancel sessions. These rules apply only to members on the member-facing
            site. As an admin, you can always add or remove participants from the Sessions dashboard without these
            limits.
          </p>
        </div>

        {!selectedBrandId ? (
          <div className="text-muted-foreground">
            Select a single brand from the brand switcher to view and update booking settings.
          </div>
        ) : loadingSettings ? (
          <div className="text-muted-foreground flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading settings…
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="max-w-xl space-y-6">
              <FormField
                control={form.control}
                name="endBookingPeriodHours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End booking period (hours before session start)</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} max={720} {...field} />
                    </FormControl>
                    <FormDescription>
                      How many hours before the session start should booking close? 0 = members can book until the
                      session starts; 1 or more = booking closes that many hours before start. Does not apply to admins
                      adding participants from the dashboard.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="cancellationDeadlineHours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cancellation deadline (hours before session start)</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} max={720} {...field} />
                    </FormControl>
                    <FormDescription>
                      Members may cancel their booking only if the session start is at least this many hours in the
                      future. E.g. 24 = cancel allowed until 24 hours before start. 0 = they may cancel until the
                      session starts. Admins can always remove participants from the dashboard regardless of this rule.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving…
                  </>
                ) : (
                  "Save settings"
                )}
              </Button>
            </form>
          </Form>
        )}
      </div>
    </RoleGuard>
  );
}
