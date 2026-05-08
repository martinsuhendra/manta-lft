"use client";

import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

import { format, parseISO } from "date-fns";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { cn } from "@/lib/utils";

/** Max days rendered at once before we window + infinite-scroll expand. */
const FULL_RENDER_THRESHOLD = 36;
const VISIBLE_COUNT = 21;
const EDGE_EXPAND = 4;
const CHUNK = 14;

function clampWindowStart(selectedIdx: number, totalLen: number): number {
  if (totalLen <= VISIBLE_COUNT) return 0;
  const maxStart = totalLen - VISIBLE_COUNT;
  return Math.min(maxStart, Math.max(0, selectedIdx - Math.floor(VISIBLE_COUNT / 2)));
}

interface DateStripDayButtonProps {
  date: string;
  isSelected: boolean;
  hasSessions: boolean;
  onPick: (date: string) => void;
}

const DateStripDayButton = memo(function DateStripDayButton({
  date,
  isSelected,
  hasSessions,
  onPick,
}: DateStripDayButtonProps) {
  const dayDate = parseISO(date);
  return (
    <button
      type="button"
      onClick={() => onPick(date)}
      aria-pressed={isSelected}
      {...(isSelected ? { "aria-current": "date" as const } : {})}
      className={cn(
        "relative flex min-w-[3.25rem] cursor-pointer flex-col items-center rounded-xl border px-2.5 py-2 text-center transition-[transform,box-shadow,background-color,border-color,color] duration-200 motion-reduce:transition-none sm:min-w-[3.75rem] sm:px-3 sm:py-2.5",
        "focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
        isSelected
          ? "border-primary bg-primary text-primary-foreground scale-[1.02] shadow-md"
          : "bg-background text-foreground border-border hover:bg-muted/60",
        !hasSessions && !isSelected && "opacity-50",
      )}
    >
      <span className="text-[10px] font-semibold tracking-wide uppercase sm:text-[11px]">{format(dayDate, "EEE")}</span>
      <span className={cn("text-lg font-bold tabular-nums sm:text-xl", isSelected && "font-extrabold")}>
        {format(dayDate, "d")}
      </span>
      {hasSessions ? (
        <span
          className={cn("mt-0.5 h-1 w-1 rounded-full", isSelected ? "bg-primary-foreground" : "bg-primary")}
          aria-hidden
        />
      ) : (
        <span className="mt-0.5 h-1 w-1" aria-hidden />
      )}
    </button>
  );
});

interface BookDateStripProps {
  allDays: string[];
  /** When the filter range changes, recentre the window. */
  rangeKey: string;
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
  datesWithSessions: Set<string>;
}

export function BookDateStrip({
  allDays,
  rangeKey,
  selectedDate,
  onSelectDate,
  datesWithSessions,
}: BookDateStripProps) {
  const [api, setApi] = useState<CarouselApi>();
  const [viewportStart, setViewportStart] = useState(0);
  const snapDeltaRef = useRef(0);
  const lastRangeKeyRef = useRef<string | null>(null);

  const useWindow = allDays.length > FULL_RENDER_THRESHOLD;

  const windowEnd = useMemo(() => {
    if (allDays.length === 0) return -1;
    if (!useWindow) return allDays.length - 1;
    return Math.min(allDays.length - 1, viewportStart + VISIBLE_COUNT - 1);
  }, [allDays.length, useWindow, viewportStart]);

  const visibleDays = useMemo(() => {
    if (allDays.length === 0) return [];
    if (!useWindow) return allDays;
    return allDays.slice(viewportStart, windowEnd + 1);
  }, [allDays, useWindow, viewportStart, windowEnd]);

  const selectedSnapInViewport = useMemo(() => {
    if (!selectedDate || visibleDays.length === 0) return -1;
    return visibleDays.indexOf(selectedDate);
  }, [selectedDate, visibleDays]);

  useEffect(() => {
    if (allDays.length === 0) return;
    if (lastRangeKeyRef.current !== rangeKey) {
      lastRangeKeyRef.current = rangeKey;
      const idx = selectedDate ? allDays.indexOf(selectedDate) : 0;
      const safeIdx = idx >= 0 ? idx : 0;
      setViewportStart(useWindow ? clampWindowStart(safeIdx, allDays.length) : 0);
    }
  }, [allDays, rangeKey, selectedDate, useWindow]);

  useEffect(() => {
    if (!useWindow || allDays.length === 0) return;
    if (selectedSnapInViewport >= 0) return;
    const idx = selectedDate ? allDays.indexOf(selectedDate) : 0;
    if (idx < 0) return;
    setViewportStart(clampWindowStart(idx, allDays.length));
  }, [allDays, selectedDate, selectedSnapInViewport, useWindow]);

  const pickDay = useCallback(
    (date: string) => {
      onSelectDate(date);
    },
    [onSelectDate],
  );

  useLayoutEffect(() => {
    if (!api || visibleDays.length === 0) return;
    const delta = snapDeltaRef.current;
    if (delta !== 0) {
      snapDeltaRef.current = 0;
      const prevSnap = api.selectedScrollSnap();
      api.reInit();
      const next = Math.max(0, Math.min(visibleDays.length - 1, prevSnap + delta));
      api.scrollTo(next, false);
      return;
    }
    if (!selectedDate) return;
    const i = visibleDays.indexOf(selectedDate);
    if (i < 0) return;
    if (api.selectedScrollSnap() !== i) api.scrollTo(i, false);
  }, [api, selectedDate, visibleDays, viewportStart]);

  useEffect(() => {
    if (!api) return;
    const handleSelect = () => {
      const i = api.selectedScrollSnap();
      // eslint-disable-next-line security/detect-object-injection -- i bound to visibleDays
      const d = visibleDays[i];
      if (!d) return;
      if (d !== selectedDate) onSelectDate(d);

      if (!useWindow) return;

      const atStart = i <= EDGE_EXPAND && viewportStart > 0;
      const atEnd = i >= visibleDays.length - 1 - EDGE_EXPAND && windowEnd < allDays.length - 1;

      if (atStart) {
        const add = Math.min(CHUNK, viewportStart);
        if (add > 0) {
          snapDeltaRef.current += add;
          setViewportStart((s) => s - add);
        }
        return;
      }

      if (atEnd) {
        const room = allDays.length - 1 - windowEnd;
        const add = Math.min(CHUNK, room);
        if (add > 0) {
          snapDeltaRef.current -= add;
          setViewportStart((s) => s + add);
        }
      }
    };
    api.on("select", handleSelect);
    return () => {
      api.off("select", handleSelect);
    };
  }, [api, allDays.length, onSelectDate, selectedDate, useWindow, visibleDays, viewportStart, windowEnd]);

  if (allDays.length === 0) return null;

  const showLeftHint = useWindow && viewportStart > 0;
  const showRightHint = useWindow && windowEnd < allDays.length - 1;

  return (
    <div className="relative w-full">
      {showLeftHint ? (
        <div
          className="from-background pointer-events-none absolute top-0 left-8 z-10 h-full w-8 bg-gradient-to-r to-transparent"
          aria-hidden
        />
      ) : null}
      {showRightHint ? (
        <div
          className="from-background pointer-events-none absolute top-0 right-8 z-10 h-full w-8 bg-gradient-to-l to-transparent"
          aria-hidden
        />
      ) : null}
      <Carousel
        opts={{
          align: "center",
          containScroll: "trimSnaps",
          dragFree: false,
          duration: 22,
        }}
        setApi={setApi}
        className="w-full"
      >
        <div className="flex items-center gap-1 sm:gap-2">
          <CarouselPrevious
            variant="outline"
            className="static top-0 left-0 z-20 size-9 shrink-0 translate-x-0 translate-y-0 rounded-full"
          />
          <CarouselContent className="-ml-2 min-w-0 flex-1 py-1">
            {visibleDays.map((date) => (
              <CarouselItem key={date} className="min-w-0 shrink-0 grow-0 basis-auto pl-2">
                <DateStripDayButton
                  date={date}
                  isSelected={date === selectedDate}
                  hasSessions={datesWithSessions.has(date)}
                  onPick={pickDay}
                />
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselNext
            variant="outline"
            className="static top-0 right-0 z-20 size-9 shrink-0 translate-x-0 translate-y-0 rounded-full"
          />
        </div>
      </Carousel>
    </div>
  );
}
