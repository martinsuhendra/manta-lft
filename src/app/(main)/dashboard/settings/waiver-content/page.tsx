"use client";

import { useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { RoleGuard } from "@/components/role-guard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { Switch } from "@/components/ui/switch";
import { USER_ROLES } from "@/lib/types";

interface WaiverItem {
  id: string;
  name: string;
  contentHtml: string;
  version: number;
  isActive: boolean;
  sortOrder: number;
}

const waiverFormSchema = z.object({
  name: z.string().trim().min(1, "Waiver name is required").max(120),
  contentHtml: z.string().min(1, "Waiver content is required"),
  isActive: z.boolean(),
});

type WaiverFormValues = z.infer<typeof waiverFormSchema>;

const emptyFormValues: WaiverFormValues = {
  name: "",
  contentHtml: "",
  isActive: true,
};

export default function WaiverContentPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingWaiver, setEditingWaiver] = useState<WaiverItem | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-waivers"],
    queryFn: async () => {
      const response = await fetch("/api/admin/waivers");
      if (!response.ok) throw new Error("Failed to load waivers");
      return response.json() as Promise<{ waivers: WaiverItem[] }>;
    },
  });

  const form = useForm<WaiverFormValues>({
    resolver: zodResolver(waiverFormSchema),
    defaultValues: emptyFormValues,
  });

  const saveMutation = useMutation({
    mutationFn: async (values: WaiverFormValues) => {
      const isEditing = Boolean(editingWaiver);
      const response = await fetch(isEditing ? `/api/admin/waivers/${editingWaiver?.id}` : "/api/admin/waivers", {
        method: isEditing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.error ?? "Failed to save waiver");
      }

      return response.json() as Promise<WaiverItem>;
    },
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: ["admin-waivers"] });
      toast.success(`Waiver saved (v${saved.version})`);
      setDialogOpen(false);
      setEditingWaiver(null);
      form.reset(emptyFormValues);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const response = await fetch(`/api/admin/waivers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.error ?? "Failed to update waiver status");
      }
      return response.json() as Promise<WaiverItem>;
    },
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: ["admin-waivers"] });
      toast.success(saved.isActive ? "Waiver activated" : "Waiver deactivated");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  function openCreateDialog() {
    setEditingWaiver(null);
    form.reset(emptyFormValues);
    setDialogOpen(true);
  }

  function openEditDialog(waiver: WaiverItem) {
    setEditingWaiver(waiver);
    form.reset({
      name: waiver.name,
      contentHtml: waiver.contentHtml,
      isActive: waiver.isActive,
    });
    setDialogOpen(true);
  }

  function onSubmit(values: WaiverFormValues) {
    saveMutation.mutate(values);
  }

  const waivers = data?.waivers ?? [];

  return (
    <RoleGuard allowedRoles={[USER_ROLES.ADMIN, USER_ROLES.SUPERADMIN, USER_ROLES.DEVELOPER]}>
      <div className="@container/main flex flex-col gap-4 md:gap-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Waivers</h1>
            <p className="text-muted-foreground">
              Manage multiple waivers. Members must accept every active waiver before booking. Editing content bumps
              that waiver&apos;s version.
            </p>
          </div>
          <Button onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Add waiver
          </Button>
        </div>

        {isLoading ? (
          <div className="text-muted-foreground flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading waivers...
          </div>
        ) : waivers.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center">
            <p className="text-muted-foreground mb-4">No waivers yet. Create your first waiver to get started.</p>
            <Button onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Add waiver
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {waivers.map((waiver) => (
              <div key={waiver.id} className="rounded-lg border p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-semibold">{waiver.name}</h2>
                      <Badge variant={waiver.isActive ? "default" : "secondary"}>
                        {waiver.isActive ? "Active" : "Inactive"}
                      </Badge>
                      <Badge variant="outline">v{waiver.version}</Badge>
                    </div>
                    <p className="text-muted-foreground line-clamp-2 text-sm">
                      {waiver.contentHtml
                        .replace(/<[^>]+>/g, " ")
                        .replace(/\s+/g, " ")
                        .trim()}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-2 rounded-md border px-3 py-2">
                      <span className="text-sm">Active</span>
                      <Switch
                        checked={waiver.isActive}
                        disabled={toggleMutation.isPending}
                        onCheckedChange={(checked) =>
                          toggleMutation.mutate({ id: waiver.id, isActive: Boolean(checked) })
                        }
                      />
                    </div>
                    <Button variant="outline" onClick={() => openEditDialog(waiver)}>
                      Edit
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <Dialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) {
              setEditingWaiver(null);
              form.reset(emptyFormValues);
            }
          }}
        >
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>{editingWaiver ? "Edit waiver" : "Add waiver"}</DialogTitle>
              <DialogDescription>
                {editingWaiver
                  ? "Updating the body creates a new version. Members who already accepted must accept again."
                  : "Create a new waiver members may need to accept before booking."}
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Liability waiver" {...field} disabled={saveMutation.isPending} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4">
                      <div className="space-y-1">
                        <FormLabel className="text-base">Active</FormLabel>
                        <FormDescription>
                          Inactive waivers are hidden from members and do not block booking.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="contentHtml"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Waiver body</FormLabel>
                      <FormControl>
                        <RichTextEditor
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Write your waiver content..."
                          disabled={saveMutation.isPending}
                          className="min-h-[18rem]"
                          isScrollable={false}
                        />
                      </FormControl>
                      {editingWaiver ? (
                        <FormDescription>
                          Current version: <strong>v{editingWaiver.version}</strong>
                        </FormDescription>
                      ) : null}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={saveMutation.isPending}>
                    {saveMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : editingWaiver ? (
                      "Save changes"
                    ) : (
                      "Create waiver"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </RoleGuard>
  );
}
