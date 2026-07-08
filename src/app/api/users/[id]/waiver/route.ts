import { NextRequest, NextResponse } from "next/server";

import { z } from "zod";

import { auth } from "@/auth";
import { prisma } from "@/lib/generated/prisma";
import { USER_ROLES } from "@/lib/types";
import {
  getActiveWaivers,
  getMemberWaiverStatus,
  getUserWaiverCompliance,
  setUserWaiverAcceptance,
} from "@/lib/waiver-settings";

const updateWaiverStatusSchema = z.object({
  waiverId: z.string().uuid(),
  isAccepted: z.boolean(),
});

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (![USER_ROLES.ADMIN, USER_ROLES.SUPERADMIN, USER_ROLES.DEVELOPER].includes(session.user.role))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await params;
    const [activeWaivers, user, status] = await Promise.all([
      getActiveWaivers(),
      prisma.user.findUnique({
        where: { id },
        select: { id: true },
      }),
      getMemberWaiverStatus(id),
    ]);

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    return NextResponse.json({
      waivers: activeWaivers,
      member: {
        waivers: status.waivers,
        hasAcceptedAll: status.hasAcceptedAll,
        pendingWaivers: status.pendingWaivers,
      },
    });
  } catch (error) {
    console.error("Failed to fetch user waiver status:", error);
    return NextResponse.json({ error: "Failed to fetch user waiver status" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (![USER_ROLES.ADMIN, USER_ROLES.SUPERADMIN, USER_ROLES.DEVELOPER].includes(session.user.role))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await params;
    const body = await request.json();
    const { waiverId, isAccepted } = updateWaiverStatusSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    await setUserWaiverAcceptance({
      userId: id,
      waiverId,
      isAccepted,
    });

    const [compliance, status] = await Promise.all([getUserWaiverCompliance(id), getMemberWaiverStatus(id)]);

    return NextResponse.json({
      waiverId,
      isAccepted,
      hasAcceptedAll: status.hasAcceptedAll,
      waiverAcceptedAt: compliance.latestAcceptedAt,
      member: {
        waivers: status.waivers,
        hasAcceptedAll: status.hasAcceptedAll,
        pendingWaivers: status.pendingWaivers,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError)
      return NextResponse.json({ error: "Validation failed", details: error.errors }, { status: 400 });

    console.error("Failed to update user waiver status:", error);
    return NextResponse.json({ error: "Failed to update user waiver status" }, { status: 500 });
  }
}
