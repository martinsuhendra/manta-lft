import { NextRequest, NextResponse } from "next/server";

import { FREEZE_REQUEST_STATUS } from "@/lib/constants/freeze";
import { isCronAuthorized } from "@/lib/cron-auth";
import { prisma } from "@/lib/generated/prisma";
import { MEMBERSHIP_STATUS } from "@/lib/types";

export async function GET(request: NextRequest) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();

    const expiredFreezes = await prisma.membershipFreezeRequest.findMany({
      where: {
        status: FREEZE_REQUEST_STATUS.APPROVED,
        freezeEndDate: { lte: now },
      },
      include: {
        membership: true,
      },
    });

    if (expiredFreezes.length === 0) {
      return NextResponse.json({
        message: "No frozen memberships to reactivate",
        reactivated: 0,
      });
    }

    await prisma.$transaction(
      expiredFreezes.flatMap((fr) => {
        const membershipExpiredPastDue = fr.membership.expiredAt <= now;
        return [
          prisma.membership.update({
            where: { id: fr.membershipId },
            data: {
              status: membershipExpiredPastDue ? MEMBERSHIP_STATUS.EXPIRED : MEMBERSHIP_STATUS.ACTIVE,
            },
          }),
          prisma.membershipFreezeRequest.update({
            where: { id: fr.id },
            data: { status: FREEZE_REQUEST_STATUS.COMPLETED },
          }),
        ];
      }),
    );

    const markedExpiredPastDue = expiredFreezes.filter((fr) => fr.membership.expiredAt <= now).length;
    const setActive = expiredFreezes.length - markedExpiredPastDue;

    return NextResponse.json({
      message:
        expiredFreezes.length === 1
          ? setActive === 1
            ? "Reactivated 1 frozen membership"
            : "Freeze ended — membership expired (past end date)"
          : `Completed ${expiredFreezes.length} ended freeze(s): ${setActive} active, ${markedExpiredPastDue} expired`,
      processed: expiredFreezes.length,
      setActive,
      markedExpiredPastDue,
    });
  } catch (error) {
    console.error("Error reactivating frozen memberships:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
