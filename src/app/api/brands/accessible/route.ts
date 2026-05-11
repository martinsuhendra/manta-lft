import { NextResponse } from "next/server";

import { requireAuth } from "@/lib/api-utils";
import { getAccessibleBrandSummariesForUser } from "@/server/brands/get-accessible-brand-summaries";

export async function GET() {
  try {
    const { error, session } = await requireAuth();
    if (error) return error;

    const brands = await getAccessibleBrandSummariesForUser({
      userId: session.user.id,
      role: session.user.role,
    });

    return NextResponse.json(brands);
  } catch (err) {
    console.error("Failed to fetch accessible brands", err);
    return NextResponse.json({ error: "Failed to fetch brands" }, { status: 500 });
  }
}
