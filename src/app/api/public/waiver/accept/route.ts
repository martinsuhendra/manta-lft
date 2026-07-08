import { NextRequest, NextResponse } from "next/server";

import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/auth";
import { USER_ROLES } from "@/lib/types";
import {
  acceptAllActiveWaiversForUser,
  acceptWaiverForUser,
  getMemberWaiverStatus,
  getWaiverById,
  hasAcceptedWaiverVersion,
} from "@/lib/waiver-settings";

const acceptWaiverSchema = z.object({
  waiverId: z.string().uuid().optional(),
  version: z.number().int().positive().optional(),
});

function getClientIp(request: NextRequest): string | null {
  const forwarded = request.headers.get("x-forwarded-for");
  if (!forwarded) return null;
  const [ip] = forwarded.split(",");
  if (!ip) return null;
  return ip.trim();
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.role !== USER_ROLES.MEMBER) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const { waiverId, version } = acceptWaiverSchema.parse(body);

    if (!waiverId) {
      const acceptances = await acceptAllActiveWaiversForUser({
        userId: session.user.id,
        acceptedIp: getClientIp(request),
        acceptedUserAgent: request.headers.get("user-agent"),
      });

      const status = await getMemberWaiverStatus(session.user.id);
      return NextResponse.json({
        acceptances,
        hasAcceptedAll: status.hasAcceptedAll,
        alreadyAccepted: acceptances.length === 0,
      });
    }

    const waiver = await getWaiverById(waiverId);
    if (!waiver) return NextResponse.json({ error: "Waiver not found" }, { status: 404 });
    if (!waiver.isActive) return NextResponse.json({ error: "Waiver is not active" }, { status: 400 });
    if (version && version !== waiver.version) {
      return NextResponse.json({ error: "Waiver version is outdated, please refresh" }, { status: 409 });
    }

    const status = await getMemberWaiverStatus(session.user.id);
    const existing = status.waivers.find((entry) => entry.id === waiverId);
    if (
      existing?.hasAccepted &&
      hasAcceptedWaiverVersion({
        acceptedVersion: existing.acceptedVersion,
        waiverVersion: waiver.version,
      })
    ) {
      return NextResponse.json({
        acceptance: {
          waiverId,
          acceptedVersion: existing.acceptedVersion,
          acceptedAt: existing.acceptedAt,
        },
        hasAcceptedAll: status.hasAcceptedAll,
        alreadyAccepted: true,
      });
    }

    const acceptance = await acceptWaiverForUser({
      userId: session.user.id,
      waiverId,
      version: waiver.version,
      acceptedIp: getClientIp(request),
      acceptedUserAgent: request.headers.get("user-agent"),
    });

    const refreshedStatus = await getMemberWaiverStatus(session.user.id);

    return NextResponse.json({
      acceptance,
      hasAcceptedAll: refreshedStatus.hasAcceptedAll,
      alreadyAccepted: false,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.errors }, { status: 400 });
    }
    console.error("Failed to accept waiver:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
