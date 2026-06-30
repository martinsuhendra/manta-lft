import { NextRequest, NextResponse } from "next/server";

import { getServerSession } from "next-auth/next";
import { z } from "zod";

import { authOptions } from "@/auth";
import { syncProductConfigSchema, syncProductConfiguration } from "@/lib/products/sync-product-config";
import { USER_ROLES } from "@/lib/types";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (![USER_ROLES.SUPERADMIN, USER_ROLES.DEVELOPER].includes(session.user.role))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id: productId } = await params;
    const body = await request.json();
    const validatedData = syncProductConfigSchema.parse(body);
    const result = await syncProductConfiguration(productId, validatedData);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error syncing product configuration:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid data", details: error.errors }, { status: 400 });
    }

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
