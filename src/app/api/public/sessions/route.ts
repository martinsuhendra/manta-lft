import { NextRequest, NextResponse } from "next/server";

import type { Prisma } from "@prisma/client";
import { getServerSession, type Session } from "next-auth";

import { authOptions } from "@/auth";
import { getBrandFilterFromRequest, requireBrandAccess } from "@/lib/api-utils";
import { sumParticipantSlotsBySessionIds } from "@/lib/booking-aggregates";
import { prisma } from "@/lib/generated/prisma";
import { getSessionStartAt } from "@/lib/session-datetime";
import { USER_ROLES } from "@/lib/types";

interface ResolvedBrandWhereResult {
  whereBrand: Prisma.ClassSessionWhereInput;
  errorResponse: NextResponse | null;
}

interface SessionWithRole {
  user?: {
    role?: string;
  };
}

async function resolvePublicSessionsBrandWhere(
  request: NextRequest,
  session: SessionWithRole | null,
): Promise<ResolvedBrandWhereResult> {
  if (session?.user?.role === USER_ROLES.MEMBER) {
    const { error, brandIds } = await requireBrandAccess(request, session as Session | null);
    if (error) return { whereBrand: {}, errorResponse: error };
    return { whereBrand: getBrandFilterFromRequest(request, brandIds), errorResponse: null };
  }

  const headerBrandId = request.headers.get("x-brand-id");
  const cookieBrandId = request.cookies.get("active_brand_id")?.value;
  const requestedBrandId = headerBrandId && headerBrandId !== "ALL" ? headerBrandId : cookieBrandId;

  if (!requestedBrandId) return { whereBrand: {}, errorResponse: null };

  const brand = await prisma.brand.findFirst({
    where: { id: requestedBrandId, isActive: true },
    select: { id: true },
  });

  if (!brand) return { whereBrand: {}, errorResponse: null };
  return { whereBrand: { brandId: brand.id }, errorResponse: null };
}

async function fetchPublicSessions({
  whereBrand,
  whereConditions,
}: {
  whereBrand: Prisma.ClassSessionWhereInput;
  whereConditions: Prisma.ClassSessionWhereInput;
}) {
  const sessions = await prisma.classSession.findMany({
    where: { ...whereConditions, ...whereBrand },
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
    },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
  });

  const now = new Date();
  // Drop sessions that have already started (studio timezone) — avoids wasted eligibility calls.
  const upcomingSessions = sessions.filter((s) => getSessionStartAt({ date: s.date, startTime: s.startTime }) > now);

  const slotTotals = await sumParticipantSlotsBySessionIds(
    upcomingSessions.map((s) => s.id),
    "not-cancelled",
  );

  return upcomingSessions.map((s) => {
    const totalSlots = slotTotals.get(s.id) ?? 0;
    return {
      ...s,
      date: s.date.toISOString().split("T")[0],
      spotsLeft: Math.max(0, s.item.capacity - totalSlots),
      capacity: s.item.capacity,
    };
  });
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const { whereBrand, errorResponse } = await resolvePublicSessionsBrandWhere(request, session);
    if (errorResponse) return errorResponse;

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const itemId = searchParams.get("itemId");

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const whereConditions: Prisma.ClassSessionWhereInput = {
      date: { gte: today },
      status: "SCHEDULED",
      visibility: "PUBLIC",
    };

    if (startDate && endDate) {
      whereConditions.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    } else if (startDate) {
      const start = new Date(startDate);
      whereConditions.date = {
        gte: start >= today ? start : today,
      };
    } else if (endDate) {
      whereConditions.date = {
        gte: today,
        lte: new Date(endDate),
      };
    }

    if (itemId) {
      whereConditions.itemId = itemId;
    }

    // Live capacity — never CDN/unstable_cache; spotsLeft must reflect bookings immediately.
    const result = await fetchPublicSessions({ whereBrand, whereConditions });

    return NextResponse.json(result, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    console.error("Error fetching member sessions:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
