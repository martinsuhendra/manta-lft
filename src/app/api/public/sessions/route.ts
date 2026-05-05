import { NextRequest, NextResponse } from "next/server";

import type { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth";

import { authOptions } from "@/auth";
import { getBrandFilterFromRequest, requireBrandAccess } from "@/lib/api-utils";
import { prisma } from "@/lib/generated/prisma";
import { sumParticipantSlots } from "@/lib/session-utils";
import { USER_ROLES } from "@/lib/types";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== USER_ROLES.MEMBER) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { error, brandIds } = await requireBrandAccess(request);
    if (error) return error;
    const whereBrand = getBrandFilterFromRequest(request, brandIds);

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
        bookings: {
          where: { status: { not: "CANCELLED" } },
          select: { id: true, participantCount: true },
        },
      },
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
    });

    const result = sessions.map((s) => {
      const { bookings, ...rest } = s;
      const totalSlots = sumParticipantSlots(bookings);
      return {
        ...rest,
        date: s.date.toISOString().split("T")[0],
        spotsLeft: Math.max(0, s.item.capacity - totalSlots),
        capacity: s.item.capacity,
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching member sessions:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
