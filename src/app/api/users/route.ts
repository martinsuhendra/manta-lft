import { NextRequest, NextResponse } from "next/server";

import { Prisma } from "@prisma/client";
import { z } from "zod";

import { auth } from "@/auth";
import { requireAdmin } from "@/lib/api-utils";
import { parseCloudinaryAsset, resolveAssetUrl } from "@/lib/cloudinary-asset";
import { prisma } from "@/lib/generated/prisma";
import { assertRoleAssignmentAllowed } from "@/lib/rbac";
import { USER_ROLES, DEFAULT_USER_ROLE } from "@/lib/types";
import { enrichUsersWithWaiverSummary } from "@/lib/waiver-settings";

function normalizePhoneNumber(value: string) {
  return value.replace(/\D/g, "");
}

const createUserSchema = z
  .object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Valid email is required"),
    role: z
      .enum([USER_ROLES.ADMIN, USER_ROLES.SUPERADMIN, USER_ROLES.DEVELOPER, USER_ROLES.MEMBER, USER_ROLES.TEACHER])
      .default(DEFAULT_USER_ROLE),
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
    emergencyContactName: z.string().min(1, "Emergency contact name is required"),
    image: z.string().nullable().optional(),
    avatarAsset: z.unknown().nullable().optional(),
    bio: z.string().max(2000).nullable().optional(),
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

function isMissingEmergencyContactNameColumnError(error: unknown) {
  if (!(error instanceof Error)) return false;
  return error.message.includes("emergency_contact_name");
}

const DEFAULT_USER_LIMIT = 50;
const MAX_USER_LIMIT = 500;

function parsePositiveInt(value: string | null, fallback: number, max: number) {
  const parsed = Number.parseInt(value ?? "", 10);
  if (Number.isNaN(parsed) || parsed < 1) return fallback;
  return Math.min(parsed, max);
}

const userListSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  phoneNo: true,
  emergencyContact: true,
  emergencyContactName: true,
  birthday: true,
  createdAt: true,
  updatedAt: true,
  _count: {
    select: {
      memberships: true,
      transactions: true,
      bookings: true,
    },
  },
} satisfies Prisma.UserSelect;

const legacyUserListSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  phoneNo: true,
  emergencyContact: true,
  birthday: true,
  createdAt: true,
  updatedAt: true,
  _count: {
    select: {
      memberships: true,
      transactions: true,
      bookings: true,
    },
  },
} satisfies Prisma.UserSelect;

export async function GET(request: NextRequest) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role");
    const search = searchParams.get("search")?.trim();
    const page = parsePositiveInt(searchParams.get("page"), 1, 10_000);
    const limit = parsePositiveInt(searchParams.get("limit"), DEFAULT_USER_LIMIT, MAX_USER_LIMIT);
    const skip = (page - 1) * limit;

    const whereCondition: Prisma.UserWhereInput = { role: { not: USER_ROLES.DEVELOPER } };

    if (role && role !== USER_ROLES.DEVELOPER && Object.values(USER_ROLES).includes(role)) {
      whereCondition.role = role;
    }

    if (search) {
      whereCondition.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phoneNo: { contains: search, mode: "insensitive" } },
      ];
    }

    let users: unknown[] = [];
    let total = 0;

    try {
      const [rows, count] = await Promise.all([
        prisma.user.findMany({
          where: whereCondition,
          select: userListSelect,
          orderBy: { createdAt: "desc" },
          skip,
          take: limit,
        }),
        prisma.user.count({ where: whereCondition }),
      ]);
      users = rows;
      total = count;
    } catch (error) {
      if (!isMissingEmergencyContactNameColumnError(error)) throw error;

      const [legacyUsers, count] = await Promise.all([
        prisma.user.findMany({
          where: whereCondition,
          select: legacyUserListSelect,
          orderBy: { createdAt: "desc" },
          skip,
          take: limit,
        }),
        prisma.user.count({ where: whereCondition }),
      ]);

      users = legacyUsers.map((user) => ({
        ...user,
        emergencyContactName: null,
      }));
      total = count;
    }

    const enrichedUsers = await enrichUsersWithWaiverSummary(users as Array<{ id: string }>);

    return NextResponse.json({
      data: enrichedUsers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    });
  } catch (error) {
    console.error("Failed to fetch users:", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const { error } = await requireAdmin(session);
    if (error) return error;

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createUserSchema.parse(body);
    const avatarAsset = parseCloudinaryAsset(validatedData.avatarAsset);
    const birthdayDate = new Date(validatedData.birthday);

    const roleCheck = assertRoleAssignmentAllowed(session.user.role, validatedData.role);
    if (!roleCheck.ok) {
      return NextResponse.json({ error: roleCheck.error }, { status: 403 });
    }

    // Check if user with this email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
      select: { id: true },
    });

    if (existingUser) {
      return NextResponse.json({ error: "User with this email already exists" }, { status: 400 });
    }

    // Create the user
    const user = await prisma.user.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        role: validatedData.role,
        phoneNo: validatedData.phoneNo,
        emergencyContact: validatedData.emergencyContact,
        emergencyContactName: validatedData.emergencyContactName,
        birthday: birthdayDate,
        avatarAsset: avatarAsset ?? Prisma.JsonNull,
        image: resolveAssetUrl(avatarAsset, validatedData.image) ?? undefined,
      },
      include: {
        _count: {
          select: {
            memberships: true,
          },
        },
      },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation error", details: error.errors }, { status: 400 });
    }

    console.error("Error creating user:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
