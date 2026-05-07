"use client";

import Image from "next/image";

import { Button } from "@/components/ui/button";

import { getClassFeatures, type ClassItem } from "./class-types";

interface ClassCardProps {
  item: ClassItem;
  onViewDetails: (item: ClassItem) => void;
}

export function ClassCard({ item, onViewDetails }: ClassCardProps) {
  const features = getClassFeatures(item);
  const accentColor = item.color ?? "var(--primary)";

  return (
    <div className="group border-border bg-card relative min-w-0 overflow-hidden rounded-xl border shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
      <div className="relative h-[160px] w-full shrink-0 overflow-hidden sm:h-[180px]">
        {item.image ? (
          <Image
            src={item.image}
            alt={item.name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="h-full w-full" style={{ backgroundColor: accentColor, opacity: 0.2 }} />
        )}
        <div className="from-card via-card/20 pointer-events-none absolute inset-0 z-[1] size-full bg-gradient-to-t to-transparent" />
        <div
          className="bg-background/90 absolute top-3 left-3 z-[2] max-w-[85%] rounded-full border-l-[3px] px-2.5 py-1 text-[10px] font-black tracking-widest uppercase shadow-md backdrop-blur sm:top-3.5 sm:left-3.5 sm:px-3 sm:text-[11px]"
          style={{ borderLeftColor: accentColor }}
        >
          <span className="line-clamp-1">{item.name}</span>
        </div>
      </div>

      <div className="space-y-3 p-3 sm:p-4">
        <h3 className="text-foreground line-clamp-2 text-base font-black tracking-tight uppercase italic sm:text-lg">
          {item.name}
        </h3>
        <p className="text-muted-foreground line-clamp-2 text-xs leading-snug sm:text-sm">
          {item.description ??
            `Structured training designed for all levels. ${item.duration}-minute sessions, max ${item.capacity} participants.`}
        </p>

        <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
          {features.map((feat) => (
            <div
              key={feat.label}
              className="border-border bg-accent/50 rounded-md border px-1 py-1.5 text-center sm:px-1.5 sm:py-2"
            >
              <div className="text-muted-foreground mb-0.5 text-[8px] font-black tracking-tighter uppercase sm:text-[9px]">
                {feat.label}
              </div>
              <div className="text-foreground truncate text-[9px] font-bold uppercase sm:text-[10px]">{feat.value}</div>
            </div>
          ))}
        </div>

        <Button
          className="hover:bg-primary hover:text-primary-foreground h-9 w-full rounded-lg text-[10px] font-black tracking-widest uppercase sm:h-10 sm:text-xs"
          variant="secondary"
          size="sm"
          onClick={() => onViewDetails(item)}
        >
          View Class Details
        </Button>
      </div>
    </div>
  );
}
