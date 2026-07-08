import { NextResponse } from "next/server";

import { handleApiError, requireAdmin } from "@/lib/api-utils";
import { ensureDefaultWaiver, listWaivers } from "@/lib/waiver-settings";

/** @deprecated Use GET /api/admin/waivers */
export async function GET() {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const waivers = await listWaivers();
    const waiver = waivers[0] ?? (await ensureDefaultWaiver());
    return NextResponse.json(waiver);
  } catch (err) {
    return handleApiError(err, "Failed to fetch waiver settings");
  }
}
