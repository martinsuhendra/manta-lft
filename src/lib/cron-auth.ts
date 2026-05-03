import { NextRequest } from "next/server";

/** Authorize Vercel cron (or manual runner) via CRON_SECRET bearer token */
export function isCronAuthorized(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) return false;

  return authHeader === `Bearer ${cronSecret}`;
}
