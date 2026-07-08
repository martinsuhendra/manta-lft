import { after, NextResponse } from "next/server";

import bcrypt from "bcryptjs";
import { z } from "zod";

import { validateRegistrationWaiver } from "@/lib/auth/register-waiver";
import { createSignupWelcomeTemplate } from "@/lib/email/auth-templates";
import { emailService } from "@/lib/email/service";
import { prisma } from "@/lib/generated/prisma";
import { DEFAULT_USER_ROLE } from "@/lib/types";
import { registerBodySchema } from "@/lib/validators";
import { acceptAllActiveWaiversForUser, getActiveWaivers } from "@/lib/waiver-settings";

function getClientIp(request: Request): string | null {
  const forwarded = request.headers.get("x-forwarded-for");
  if (!forwarded) return null;
  const [ip] = forwarded.split(",");
  if (!ip) return null;
  return ip.trim();
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      email,
      password,
      name,
      phoneNo,
      emergencyContact,
      emergencyContactName,
      birthday,
      waiverAcceptances,
      acceptWaiver,
    } = registerBodySchema.parse(body);
    const activeWaivers = await getActiveWaivers();
    const waiverError = validateRegistrationWaiver(activeWaivers, { acceptWaiver, waiverAcceptances });
    if (waiverError) {
      return NextResponse.json({ error: waiverError.error }, { status: waiverError.status });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ error: "User with this email already exists" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        phoneNo,
        emergencyContact,
        emergencyContactName,
        birthday: new Date(birthday),
        role: DEFAULT_USER_ROLE,
      },
    });

    if (activeWaivers.length > 0 && acceptWaiver) {
      await acceptAllActiveWaiversForUser({
        userId: user.id,
        acceptedIp: getClientIp(request),
        acceptedUserAgent: request.headers.get("user-agent"),
      });
    }

    const appBase = process.env.NEXTAUTH_URL?.replace(/\/$/, "") ?? "";
    const shopUrl = appBase ? `${appBase}/public` : "#";
    after(async () => {
      try {
        const welcomeTemplate = await createSignupWelcomeTemplate(name, shopUrl);
        const sent = await emailService.sendEmail(email, welcomeTemplate);
        if (!sent) console.error("Failed to send welcome email to:", email);
      } catch (emailError) {
        console.error("Welcome email error:", emailError);
      }
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...userWithoutPassword } = user;
    return NextResponse.json({
      message: "User created successfully",
      user: userWithoutPassword,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input data", details: error.errors }, { status: 400 });
    }

    console.error("Registration error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
