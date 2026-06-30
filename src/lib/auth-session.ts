import { shouldRedirectToDashboardAfterAuth } from "@/lib/rbac";

export const DASHBOARD_HOME_PATH = "/dashboard/home";
export const PUBLIC_HOME_PATH = "/public";

export function isSafeInternalPath(path: string | null | undefined): path is string {
  if (!path || !path.startsWith("/") || path.startsWith("//")) return false;
  return true;
}

export function isDashboardPath(path: string): boolean {
  return path === "/dashboard" || path.startsWith("/dashboard/");
}

export function normalizeDashboardCallbackPath(path: string): string {
  if (path === "/dashboard" || path === "/dashboard/") return DASHBOARD_HOME_PATH;
  return path;
}

export function buildAuthContinueUrl(callbackUrl?: string | null): string {
  if (!isSafeInternalPath(callbackUrl)) return "/auth/continue";
  return `/auth/continue?callbackUrl=${encodeURIComponent(callbackUrl)}`;
}

export function redirectToAuthContinue(callbackUrl?: string | null): void {
  window.location.assign(buildAuthContinueUrl(callbackUrl));
}

export function getPostAuthRedirectPath(role: string | undefined, callbackUrl?: string | null) {
  const shouldUseDashboard = shouldRedirectToDashboardAfterAuth(role);

  if (!shouldUseDashboard) {
    return PUBLIC_HOME_PATH;
  }

  if (isSafeInternalPath(callbackUrl) && isDashboardPath(callbackUrl)) {
    return normalizeDashboardCallbackPath(callbackUrl);
  }

  return DASHBOARD_HOME_PATH;
}
