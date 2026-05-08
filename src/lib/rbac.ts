import { USER_ROLES } from "@/lib/types";

/** Admin dashboard operators (not TEACHER, not MEMBER). */
export const RBAC_ADMIN_ROLES: readonly string[] = [USER_ROLES.ADMIN, USER_ROLES.SUPERADMIN, USER_ROLES.DEVELOPER];

/** SUPERADMIN + DEVELOPER — items, products, brands API (server). */
export const RBAC_SUPERADMIN_EDGE_ROLES: readonly string[] = [USER_ROLES.SUPERADMIN, USER_ROLES.DEVELOPER];

/** Developer-only UI (e.g. Brands nav). */
export const RBAC_DEVELOPER_ONLY_ROLES: readonly string[] = [USER_ROLES.DEVELOPER];

/** Sessions list/calendar read access (includes teacher read-only). */
export const RBAC_SESSIONS_MENU_ROLES: readonly string[] = [...RBAC_ADMIN_ROLES, USER_ROLES.TEACHER];

/** Payroll summary read access (includes teacher self-only). */
export const RBAC_PAYROLL_MENU_ROLES: readonly string[] = [...RBAC_ADMIN_ROLES, USER_ROLES.TEACHER];

/** After sign-in, send these roles to the dashboard by default (others → /public). */
export const RBAC_DEFAULT_DASHBOARD_REDIRECT_ROLES: readonly string[] = [...RBAC_ADMIN_ROLES, USER_ROLES.TEACHER];

/** Private session admin API (create + eligibility) — admin operators only. */
export const RBAC_PRIVATE_SESSION_ADMIN_ROLES: readonly string[] = [...RBAC_ADMIN_ROLES];

export function isRbacRoleAllowed(role: string | undefined, allowed: readonly string[]): boolean {
  return !!role && allowed.includes(role);
}

export function shouldRedirectToDashboardAfterAuth(role: string | undefined): boolean {
  return isRbacRoleAllowed(role, RBAC_DEFAULT_DASHBOARD_REDIRECT_ROLES);
}
