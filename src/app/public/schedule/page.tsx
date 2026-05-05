import { Suspense } from "react";

import { Metadata } from "next";

import { addDays, startOfDay } from "date-fns";

import { APP_CONFIG } from "@/config/app-config";
import { resolveActiveBrandIdFromCookie } from "@/lib/brand-cookie";
import { prisma } from "@/lib/generated/prisma";
import { mapSessionWithCapacity } from "@/lib/session-utils";

import { ScheduleFilters } from "../_components/schedule-filters";
import { UpcomingSessions } from "../_components/upcoming-sessions";
import { getClasses } from "../_lib/shop-queries";

export const metadata: Metadata = {
  title: `${APP_CONFIG.name} - Full Schedule`,
  description: "View our upcoming class schedule.",
};

async function getFullSchedule(start?: string, end?: string, itemId?: string, brandId?: string) {
  try {
    const today = startOfDay(new Date());
    const defaultEnd = addDays(today, 30);

    const startDate = start ? new Date(start) : today;
    const endDate = end ? new Date(end) : defaultEnd;

    const sessions = await prisma.classSession.findMany({
      where: {
        date: {
          gte: startDate < today ? today : startDate,
          lte: endDate,
        },
        status: "SCHEDULED",
        item: {
          isActive: true,
          isPublic: true,
        },
        ...(brandId ? { brandId } : {}),
        ...(itemId && itemId !== "all" ? { itemId } : {}),
      },
      include: {
        item: {
          select: {
            id: true,
            name: true,
            duration: true,
            capacity: true,
            color: true,
          },
        },
        teacher: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        bookings: {
          where: { status: { not: "CANCELLED" } },
          select: { id: true, participantCount: true },
        },
      },
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
    });

    return sessions.map(mapSessionWithCapacity);
  } catch (error) {
    console.error("Failed to fetch full schedule:", error);
    return [];
  }
}

interface SchedulePageProps {
  searchParams: Promise<{ start?: string; end?: string; item?: string }>;
}

export default async function SchedulePage({ searchParams }: SchedulePageProps) {
  const params = await searchParams;
  const start = typeof params.start === "string" ? params.start : undefined;
  const end = typeof params.end === "string" ? params.end : undefined;
  const itemId = typeof params.item === "string" ? params.item : undefined;

  const activeBrandId = await resolveActiveBrandIdFromCookie();
  const [sessions, classItems] = await Promise.all([
    getFullSchedule(start, end, itemId, activeBrandId ?? undefined),
    getClasses(activeBrandId ?? undefined),
  ]);
  const classes = classItems.map(({ id, name }) => ({ id, name }));

  return (
    <>
      <Suspense
        fallback={
          <div className="border-b border-slate-200 bg-white px-6 py-6 dark:border-slate-800 dark:bg-slate-900" />
        }
      >
        <ScheduleFilters items={classes} />
      </Suspense>
      <UpcomingSessions sessions={sessions} showViewFullSchedule={false} todayOnly={false} />
    </>
  );
}
