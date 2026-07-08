"use client";

import { useState } from "react";

import Link from "next/link";

import { ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";

import { ClassCard } from "./class-card";
import { ClassDetailsDialog } from "./class-details-dialog";
import type { ClassItem } from "./class-types";
import { SectionWithPattern } from "./section-with-pattern";

interface ClassesSectionProps {
  classes: ClassItem[];
}

export function ClassesSection({ classes }: ClassesSectionProps) {
  const [selectedClass, setSelectedClass] = useState<ClassItem | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  if (classes.length === 0) return null;

  const handleOpenDetails = (item: ClassItem) => {
    setSelectedClass(item);
    setIsDialogOpen(true);
  };

  return (
    <SectionWithPattern
      id="classes"
      className="border-border/30 bg-brand-accent sporty-section-fill relative border-y py-24"
    >
      <div className="relative mx-auto max-w-7xl px-4">
        <div className="mb-10 flex flex-col gap-4 sm:mb-16 sm:gap-6 md:flex-row md:items-end md:justify-between">
          <div className="min-w-0">
            <h2 className="mb-3 text-2xl font-black tracking-tighter text-white uppercase italic sm:mb-4 sm:text-3xl md:text-5xl">
              Specialized <span className="text-brand-primary">Disciplines</span>
            </h2>
            <p className="max-w-xl text-sm text-white/75 sm:text-base">
              Whether you&apos;re looking for the explosive variety of CrossFit or the endurance-focused challenge of
              HYROX, our specialized classes are designed for every fitness level.
            </p>
          </div>
          <Button
            variant="ghost"
            className="text-brand-primary hover:text-brand-primary gap-2 font-bold tracking-widest uppercase hover:gap-3 hover:bg-white/10"
            asChild
          >
            <Link href="/public/book">
              Book a Class
              <ChevronRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="grid gap-4 sm:gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {classes.map((item) => (
            <ClassCard key={item.id} item={item} onViewDetails={handleOpenDetails} />
          ))}
        </div>
      </div>

      <ClassDetailsDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} selectedClass={selectedClass} />
    </SectionWithPattern>
  );
}
