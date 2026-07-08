import { NextResponse } from "next/server";

import { getServerSession } from "next-auth";

import { authOptions } from "@/auth";
import { createPublicCache, publicCacheHeaders } from "@/lib/http-cache";
import { USER_ROLES } from "@/lib/types";
import { ensureDefaultWaiver, getActiveWaivers, getMemberWaiverStatus } from "@/lib/waiver-settings";

const getCachedPublicWaivers = createPublicCache(["public-waivers"], async () => {
  const waivers = await getActiveWaivers();
  if (waivers.length === 0) {
    const defaultWaiver = await ensureDefaultWaiver();
    return defaultWaiver.isActive ? [defaultWaiver] : [];
  }
  return waivers;
});

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (session?.user.id && session.user.role === USER_ROLES.MEMBER) {
      const status = await getMemberWaiverStatus(session.user.id);

      return NextResponse.json({
        waivers: status.waivers,
        hasAcceptedAll: status.hasAcceptedAll,
        pendingWaivers: status.pendingWaivers,
      });
    }

    const waivers = await getCachedPublicWaivers();

    return NextResponse.json({ waivers }, { headers: publicCacheHeaders() });
  } catch (error) {
    console.error("Failed to fetch waiver:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
