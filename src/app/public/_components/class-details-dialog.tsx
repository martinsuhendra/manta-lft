"use client";

import Image from "next/image";
import Link from "next/link";

import { Clock3, Dumbbell, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { getClassFeatures, type ClassItem } from "./class-types";

interface ClassDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedClass: ClassItem | null;
}

export function ClassDetailsDialog({ open, onOpenChange, selectedClass }: ClassDetailsDialogProps) {
  const selectedClassFeatures = selectedClass ? getClassFeatures(selectedClass) : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        {selectedClass ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl font-black tracking-tight uppercase">{selectedClass.name}</DialogTitle>
              <DialogDescription>
                Learn about this class and jump straight to schedules with this class pre-selected.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="bg-muted relative aspect-video w-full overflow-hidden rounded-lg border">
                {selectedClass.image ? (
                  <Image
                    src={selectedClass.image}
                    alt={selectedClass.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 640px"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <Dumbbell className="text-muted-foreground h-12 w-12" />
                  </div>
                )}
              </div>

              <div className="text-muted-foreground flex flex-wrap items-center gap-4 text-sm">
                <span className="inline-flex items-center gap-1.5">
                  <Clock3 className="h-4 w-4" />
                  {selectedClass.duration} min
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Users className="h-4 w-4" />
                  Max {selectedClass.capacity}
                </span>
              </div>

              <p className="text-muted-foreground text-sm leading-relaxed">
                {selectedClass.description ??
                  `Structured training designed for all levels. ${selectedClass.duration}-minute sessions with up to ${selectedClass.capacity} participants.`}
              </p>

              <div className="grid grid-cols-3 gap-2">
                {selectedClassFeatures.map((feat) => (
                  <div key={feat.label} className="border-border bg-accent/50 rounded-md border px-2 py-2 text-center">
                    <div className="text-muted-foreground text-[9px] font-black tracking-tighter uppercase">
                      {feat.label}
                    </div>
                    <div className="text-foreground truncate text-[10px] font-bold uppercase">{feat.value}</div>
                  </div>
                ))}
              </div>
            </div>

            <DialogFooter className="gap-2 sm:justify-end">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
              <Button asChild>
                <Link href={`/public/book?item=${selectedClass.id}`} onClick={() => onOpenChange(false)}>
                  See Schedules
                </Link>
              </Button>
            </DialogFooter>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
