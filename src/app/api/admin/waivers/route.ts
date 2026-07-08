import { NextRequest, NextResponse } from "next/server";

import { z } from "zod";

import { handleApiError, requireAdmin } from "@/lib/api-utils";
import { createWaiver, ensureDefaultWaiver, isMeaningfulWaiverHtml, listWaivers } from "@/lib/waiver-settings";

const createWaiverSchema = z.object({
  name: z.string().trim().min(1, "Waiver name is required").max(120),
  contentHtml: z
    .string()
    .min(1, "Waiver content is required")
    .refine((value) => isMeaningfulWaiverHtml(value), "Waiver content cannot be empty"),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().min(0).optional(),
});

export async function GET() {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const waivers = await listWaivers();
    if (waivers.length === 0) {
      const defaultWaiver = await ensureDefaultWaiver();
      return NextResponse.json({ waivers: [defaultWaiver] });
    }

    return NextResponse.json({ waivers });
  } catch (err) {
    return handleApiError(err, "Failed to fetch waivers");
  }
}

export async function POST(request: NextRequest) {
  try {
    const { error, user } = await requireAdmin();
    if (error) return error;

    const body = await request.json();
    const validated = createWaiverSchema.parse(body);

    const waiver = await createWaiver({
      name: validated.name,
      contentHtml: validated.contentHtml,
      isActive: validated.isActive,
      sortOrder: validated.sortOrder,
      updatedById: user.id,
    });

    return NextResponse.json(waiver, { status: 201 });
  } catch (err) {
    return handleApiError(err, "Failed to create waiver");
  }
}
