"use client";

import { useRouter, useSearchParams } from "next/navigation";

import { addDays, format, startOfDay } from "date-fns";
import { CalendarIcon, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface ClassItem {
  id: string;
  name: string;
}

interface ScheduleFiltersProps {
  items: ClassItem[];
}

const defaultStart = format(startOfDay(new Date()), "yyyy-MM-dd");
const defaultEnd = format(addDays(startOfDay(new Date()), 30), "yyyy-MM-dd");

export function ScheduleFilters({ items }: ScheduleFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const start = searchParams.get("start") ?? defaultStart;
  const end = searchParams.get("end") ?? defaultEnd;
  const itemId = searchParams.get("item") ?? "all";

  const updateFilters = (updates: { start?: string; end?: string; item?: string }) => {
    const params = new URLSearchParams(searchParams.toString());
    if (updates.start !== undefined) params.set("start", updates.start);
    if (updates.end !== undefined) params.set("end", updates.end);
    if (updates.item !== undefined) params.set("item", updates.item);
    router.push(`/public/schedule?${params.toString()}`);
  };

  const resetFilters = () => {
    router.push("/public/schedule");
  };

  const hasActiveFilters = start !== defaultStart || end !== defaultEnd || itemId !== "all";

  const startDate = start ? new Date(start + "T00:00:00") : undefined;
  const endDate = end ? new Date(end + "T00:00:00") : undefined;

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="border-border bg-background mx-auto max-w-3xl rounded-lg border p-2 sm:p-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {/* Date Range Picker */}
          <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "border-border bg-background h-10 flex-1 justify-start text-left font-normal",
                    !start && "text-muted-foreground",
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {start ? format(startDate!, "MMM d, yyyy") : "From"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={(date) => date && updateFilters({ start: format(date, "yyyy-MM-dd") })}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            <span className="text-muted-foreground hidden text-xs sm:inline">to</span>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "border-border bg-background h-10 flex-1 justify-start text-left font-normal",
                    !end && "text-muted-foreground",
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {end ? format(endDate!, "MMM d, yyyy") : "To"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={(date) => date && updateFilters({ end: format(date, "yyyy-MM-dd") })}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <Separator orientation="vertical" className="hidden h-8 sm:block" />

          {/* Class Select */}
          <div className="w-full sm:w-[200px]">
            <Select value={itemId} onValueChange={(v) => updateFilters({ item: v })}>
              <SelectTrigger className="border-border bg-background h-10 w-full">
                <SelectValue placeholder="All classes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All classes</SelectItem>
                {items.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Reset Button */}
          {hasActiveFilters && (
            <div className="flex justify-end sm:w-auto">
              <Button
                variant="ghost"
                size="icon"
                onClick={resetFilters}
                className="text-muted-foreground hover:bg-muted h-10 w-10 rounded-full"
                title="Reset filters"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Reset filters</span>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
