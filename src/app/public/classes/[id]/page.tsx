import { Metadata } from "next";
import Link from "next/link";

import { addDays } from "date-fns";
import { ArrowLeft, Dumbbell, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { APP_CONFIG } from "@/config/app-config";
import { resolveActiveBrandIdFromCookie } from "@/lib/brand-cookie";
import { prisma } from "@/lib/generated/prisma";
import { mapSessionWithCapacity } from "@/lib/session-utils";

import { UpcomingSessions } from "../../_components/upcoming-sessions";

interface ClassDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: ClassDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const activeBrandId = await resolveActiveBrandIdFromCookie();
  const item = await prisma.item.findFirst({
    where: {
      id,
      isActive: true,
      isPublic: true,
      ...(activeBrandId ? { itemBrands: { some: { brandId: activeBrandId } } } : {}),
    },
    select: { name: true, description: true },
  });
  if (!item) return { title: "Class Not Found" };
  return {
    title: `${item.name} - ${APP_CONFIG.name}`,
    description: item.description ?? `Learn more about ${item.name} at ${APP_CONFIG.name}`,
  };
}

async function getClassById(id: string, brandId?: string) {
  try {
    const item = await prisma.item.findFirst({
      where: { id, isActive: true, isPublic: true, ...(brandId ? { itemBrands: { some: { brandId } } } : {}) },
      select: {
        id: true,
        name: true,
        description: true,
        duration: true,
        capacity: true,
        color: true,
        image: true,
      },
    });
    return item;
  } catch {
    return null;
  }
}

async function getUpcomingSessionsForClass(itemId: string, brandId?: string) {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const nextMonth = addDays(today, 30);

    const sessions = await prisma.classSession.findMany({
      where: {
        itemId,
        ...(brandId ? { brandId } : {}),
        date: { gte: today, lte: nextMonth },
        status: "SCHEDULED",
        item: {
          isActive: true,
          isPublic: true,
        },
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
  } catch {
    return [];
  }
}

export default async function ClassDetailPage({ params }: ClassDetailPageProps) {
  const { id } = await params;
  const activeBrandId = await resolveActiveBrandIdFromCookie();
  const [item, sessions] = await Promise.all([
    getClassById(id, activeBrandId ?? undefined),
    getUpcomingSessionsForClass(id, activeBrandId ?? undefined),
  ]);

  if (!item) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Class not found</h1>
          <p className="text-muted-foreground mt-2">
            The class you&apos;re looking for doesn&apos;t exist or has been removed.
          </p>
          <Button asChild className="mt-6">
            <Link href="/public">Back to Shop</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="border-b bg-slate-50 dark:bg-slate-950">
        <div className="container mx-auto px-4 py-6 sm:py-8">
          <Link
            href="/public#classes"
            className="text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-2 text-sm sm:mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to classes
          </Link>
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:gap-8">
            <div className="bg-muted aspect-video w-full max-w-md shrink-0 overflow-hidden rounded-xl md:aspect-square">
              {item.image ? (
                /* eslint-disable-next-line @next/next/no-img-element -- item image from CMS */
                <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
              ) : (
                <div
                  className="flex h-full w-full items-center justify-center"
                  style={{ backgroundColor: item.color || "hsl(var(--muted))" }}
                >
                  <Dumbbell className="h-24 w-24 opacity-20" />
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-bold sm:text-3xl">{item.name}</h1>
              <div className="text-muted-foreground mt-3 flex flex-wrap items-center gap-4 text-sm sm:mt-4 sm:gap-6">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span>Max {item.capacity} participants</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{item.duration} min</span>
                </div>
              </div>
              {item.description && <p className="text-muted-foreground mt-6 leading-relaxed">{item.description}</p>}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 sm:py-12">
        <h2 className="text-xl font-bold sm:text-2xl">Upcoming sessions</h2>
        <p className="text-muted-foreground mt-1 text-sm sm:text-base">Book a spot for this class.</p>
        <div className="mt-6 sm:mt-8">
          <UpcomingSessions sessions={sessions} hideTitle todayOnly={false} />
        </div>
      </div>
    </>
  );
}
