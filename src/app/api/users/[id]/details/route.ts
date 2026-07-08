import { NextRequest, NextResponse } from "next/server";

import type { Prisma } from "@prisma/client";

import { auth } from "@/auth";
import { prisma } from "@/lib/generated/prisma";
import { USER_ROLES } from "@/lib/types";
import { getUserWaiverCompliance } from "@/lib/waiver-settings";

const DETAIL_SECTIONS = ["memberships", "transactions", "bookings", "classSessions"] as const;
type DetailSection = (typeof DETAIL_SECTIONS)[number];

const DEFAULT_SECTION_LIMIT = 50;
const MAX_SECTION_LIMIT = 100;

function parsePositiveInt(value: string | null, fallback: number, max: number) {
  const parsed = Number.parseInt(value ?? "", 10);
  if (Number.isNaN(parsed) || parsed < 1) return fallback;
  return Math.min(parsed, max);
}

function parseIncludes(includeParam: string | null): DetailSection[] {
  if (!includeParam) return [];

  return includeParam
    .split(",")
    .map((value) => value.trim())
    .filter((value): value is DetailSection => DETAIL_SECTIONS.includes(value as DetailSection));
}

const userBaseSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  phoneNo: true,
  emergencyContact: true,
  emergencyContactName: true,
  birthday: true,
  image: true,
  bio: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

function buildSectionSelect(includes: DetailSection[], limit: number, skip: number): Prisma.UserSelect {
  const select: Prisma.UserSelect = {
    ...userBaseSelect,
    _count: {
      select: {
        memberships: true,
        transactions: true,
        bookings: true,
        classSessions: true,
      },
    },
  };

  if (includes.includes("memberships")) {
    select.memberships = {
      include: {
        product: {
          select: {
            id: true,
            name: true,
            price: true,
            validDays: true,
            paymentUrl: true,
          },
        },
        transaction: {
          select: {
            id: true,
            status: true,
            amount: true,
            currency: true,
            paidAt: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip,
    };
  }

  if (includes.includes("transactions")) {
    select.transactions = {
      include: {
        product: {
          select: {
            id: true,
            name: true,
            price: true,
            paymentUrl: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip,
    };
  }

  if (includes.includes("bookings")) {
    select.bookings = {
      include: {
        classSession: {
          include: {
            item: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        membership: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip,
    };
  }

  if (includes.includes("classSessions")) {
    select.classSessions = {
      where: {
        date: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        status: "SCHEDULED",
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
        _count: {
          select: { bookings: true },
        },
      },
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
      take: limit,
      skip,
    };
  }

  return select;
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (![USER_ROLES.ADMIN, USER_ROLES.SUPERADMIN, USER_ROLES.DEVELOPER].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const includes = parseIncludes(searchParams.get("include"));
    const limit = parsePositiveInt(searchParams.get("limit"), DEFAULT_SECTION_LIMIT, MAX_SECTION_LIMIT);
    const page = parsePositiveInt(searchParams.get("page"), 1, 10_000);
    const skip = (page - 1) * limit;

    const user = await prisma.user.findUnique({
      where: { id },
      select: buildSectionSelect(includes, limit, skip),
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const waiverCompliance = await getUserWaiverCompliance(id);
    const userWithWaiver = {
      ...user,
      waiverAcceptedAt: waiverCompliance.latestAcceptedAt,
      hasAcceptedAllWaivers: waiverCompliance.hasAcceptedAllActive,
      pendingWaiverCount: waiverCompliance.pendingWaivers.length,
    };

    if (includes.length === 0 && user.role === USER_ROLES.TEACHER) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const scheduledSessionCount = await prisma.classSession.count({
        where: {
          teacherId: id,
          date: { gte: today },
          status: "SCHEDULED",
        },
      });

      return NextResponse.json({ ...userWithWaiver, scheduledSessionCount });
    }

    return NextResponse.json(userWithWaiver);
  } catch (error) {
    console.error("Failed to fetch user details:", error);
    return NextResponse.json({ error: "Failed to fetch user details" }, { status: 500 });
  }
}
