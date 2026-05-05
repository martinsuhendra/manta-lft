import { NextRequest, NextResponse } from "next/server";

import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/auth";
import { prisma } from "@/lib/generated/prisma";
import { USER_ROLES } from "@/lib/types";
import { getWaiverSettings, hasAcceptedCurrentWaiver } from "@/lib/waiver-settings";

const acceptWaiverSchema = z.object({
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
    const { version } = acceptWaiverSchema.parse(body);
    const waiver = await getWaiverSettings();

    if (!waiver.isActive) {
      return NextResponse.json({ error: "Waiver is not active" }, { status: 400 });
    }
    if (version && version !== waiver.version) {
      return NextResponse.json({ error: "Waiver version is outdated, please refresh" }, { status: 409 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, waiverAcceptedVersion: true },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (
      hasAcceptedCurrentWaiver({
        acceptedVersion: user.waiverAcceptedVersion,
        waiverVersion: waiver.version,
      })
    ) {
      return NextResponse.json({
        acceptedVersion: user.waiverAcceptedVersion,
        alreadyAccepted: true,
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        waiverAcceptedAt: new Date(),
        waiverAcceptedVersion: waiver.version,
        waiverAcceptedIp: getClientIp(request),
        waiverAcceptedUserAgent: request.headers.get("user-agent"),
      },
      select: {
        waiverAcceptedAt: true,
        waiverAcceptedVersion: true,
      },
    });

    return NextResponse.json({
      acceptedAt: updatedUser.waiverAcceptedAt,
      acceptedVersion: updatedUser.waiverAcceptedVersion,
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
