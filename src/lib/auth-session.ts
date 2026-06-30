import type { Session } from "next-auth";
import { getSession } from "next-auth/react";

import { shouldRedirectToDashboardAfterAuth } from "@/lib/rbac";

interface WaitForSessionOptions {
  maxAttempts?: number;
  delayMs?: number;
}

export async function waitForAuthenticatedSession(options: WaitForSessionOptions = {}): Promise<Session | null> {
  const { maxAttempts = 15, delayMs = 50 } = options;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const session = await getSession();
    if (session?.user.role) return session;

    if (attempt < maxAttempts - 1) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  return getSession();
}

export function getPostAuthRedirectPath(role: string | undefined) {
  return shouldRedirectToDashboardAfterAuth(role) ? "/dashboard/home" : "/public";
}
