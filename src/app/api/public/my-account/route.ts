import { NextRequest, NextResponse } from "next/server";

import { z } from "zod";

import { auth } from "@/auth";
import { prisma } from "@/lib/generated/prisma";

function normalizePhoneNumber(value: string) {
  return value.replace(/\D/g, "");
}

const updateProfileSchema = z
  .object({
    name: z.string().min(1, "Name is required"),
    phoneNo: z
      .string()
      .min(1, "Phone number is required")
      .min(10, "Phone number must be at least 10 digits")
      .max(15, "Phone number must be at most 15 digits")
      .regex(/^[0-9+\-\s()]+$/, "Invalid phone number format"),
    emergencyContact: z
      .string()
      .min(10, "Emergency contact must be at least 10 digits")
      .max(15, "Emergency contact must be at most 15 digits")
      .regex(/^[0-9+\-\s()]+$/, "Invalid emergency contact format"),
    birthday: z
      .string({ required_error: "Birthday is required" })
      .min(1, "Birthday is required")
      .refine((value) => !Number.isNaN(new Date(value).getTime()), "Invalid date")
      .refine((value) => new Date(value).getTime() < Date.now(), "Birthday must be in the past"),
  })
  .superRefine((data, ctx) => {
    if (normalizePhoneNumber(data.phoneNo) !== normalizePhoneNumber(data.emergencyContact)) return;
    ctx.addIssue({
      code: "custom",
      message: "Emergency contact must be different from phone number",
      path: ["emergencyContact"],
    });
  });

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = updateProfileSchema.parse(body);

    // Update the user's own profile (excluding email)
    const birthdayForDb = new Date(validatedData.birthday);

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name: validatedData.name,
        phoneNo: validatedData.phoneNo,
        emergencyContact: validatedData.emergencyContact,
        birthday: birthdayForDb,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phoneNo: true,
        emergencyContact: true,
        birthday: true,
        role: true,
        createdAt: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation error", details: error.errors }, { status: 400 });
    }

    console.error("Failed to update profile:", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
