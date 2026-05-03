import { NextRequest, NextResponse } from "next/server";

import { isCronAuthorized } from "@/lib/cron-auth";
import { prisma } from "@/lib/generated/prisma";
import { MEMBERSHIP_STATUS } from "@/lib/types";

export async function GET(request: NextRequest) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();

    const result = await prisma.membership.updateMany({
      where: {
        expiredAt: { lte: now },
        status: {
          in: [MEMBERSHIP_STATUS.ACTIVE, MEMBERSHIP_STATUS.FREEZED, MEMBERSHIP_STATUS.PENDING],
        },
      },
      data: { status: MEMBERSHIP_STATUS.EXPIRED },
    });

    return NextResponse.json({
      message: result.count === 0 ? "No memberships to expire" : `Expired ${result.count} membership(s)`,
      expiredCount: result.count,
    });
  } catch (error) {
    console.error("Error expiring memberships:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
