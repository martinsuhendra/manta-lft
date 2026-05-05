"use client";

import type { AxiosError } from "axios";
import { Power } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useDeleteBrand } from "@/hooks/use-brand-mutation";
import type { BrandAdmin } from "@/hooks/use-brands-query";

interface DeactivateBrandDialogProps {
  brand: BrandAdmin | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeactivateBrandDialog({ brand, open, onOpenChange }: DeactivateBrandDialogProps) {
  const deleteBrand = useDeleteBrand();
  const deleteError = deleteBrand.error as AxiosError<{ reasons?: string[]; error?: string }> | null;
  const reasons = deleteError?.response?.data.reasons ?? [];

  const handleDeactivate = () => {
    if (!brand?.id) return;
    deleteBrand.mutate(brand.id, {
      onSuccess: () => onOpenChange(false),
    });
  };

  if (!brand) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Power className="text-destructive h-5 w-5" />
            Delete brand
          </AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to permanently delete <strong>{brand.name}</strong>? This is only allowed when the
            brand has no blocking dependencies.
          </AlertDialogDescription>
          {reasons.length > 0 && (
            <div className="bg-destructive/10 border-destructive/20 rounded-md border p-3 text-sm">
              <p className="text-destructive mb-2 font-medium">This brand cannot be deleted yet:</p>
              <ul className="text-muted-foreground list-disc space-y-1 pl-5">
                {reasons.map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>
            </div>
          )}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDeactivate}
            disabled={deleteBrand.isPending}
            className="bg-destructive hover:bg-destructive/90 text-white hover:text-white"
          >
            {deleteBrand.isPending ? "Deleting…" : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
