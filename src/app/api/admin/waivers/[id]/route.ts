import { NextRequest, NextResponse } from "next/server";

import { z } from "zod";

import { handleApiError, requireAdmin } from "@/lib/api-utils";
import { getWaiverById, isMeaningfulWaiverHtml, updateWaiver } from "@/lib/waiver-settings";

const updateWaiverSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  contentHtml: z
    .string()
    .min(1, "Waiver content is required")
    .refine((value) => isMeaningfulWaiverHtml(value), "Waiver content cannot be empty")
    .optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().min(0).optional(),
});

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { error, user } = await requireAdmin();
    if (error) return error;

    const { id } = await params;
    const existing = await getWaiverById(id);
    if (!existing) return NextResponse.json({ error: "Waiver not found" }, { status: 404 });

    const body = await request.json();
    const validated = updateWaiverSchema.parse(body);

    const waiver = await updateWaiver(id, {
      ...validated,
      updatedById: user.id,
    });

    return NextResponse.json(waiver);
  } catch (err) {
    return handleApiError(err, "Failed to update waiver");
  }
}
