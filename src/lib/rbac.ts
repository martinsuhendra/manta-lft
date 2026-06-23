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

/** May change another user's role (subject to per-actor assignment rules). */
export const RBAC_ROLE_EDITOR_ROLES: readonly string[] = [...RBAC_ADMIN_ROLES];

/** May assign SUPERADMIN on create or update. */
export const RBAC_SUPERADMIN_ASSIGNER_ROLES: readonly string[] = [USER_ROLES.SUPERADMIN, USER_ROLES.DEVELOPER];

/** Protected target roles that ADMIN cannot modify. */
export const RBAC_ADMIN_IMMUTABLE_TARGET_ROLES: readonly string[] = [USER_ROLES.SUPERADMIN, USER_ROLES.DEVELOPER];

export function isRbacRoleAllowed(role: string | undefined, allowed: readonly string[]): boolean {
  return !!role && allowed.includes(role);
}

export function shouldRedirectToDashboardAfterAuth(role: string | undefined): boolean {
  return isRbacRoleAllowed(role, RBAC_DEFAULT_DASHBOARD_REDIRECT_ROLES);
}

export function canActorEditUserRoles(actorRole: string | undefined): boolean {
  return isRbacRoleAllowed(actorRole, RBAC_ROLE_EDITOR_ROLES);
}

export function canActorAssignSuperAdminRole(actorRole: string | undefined): boolean {
  return isRbacRoleAllowed(actorRole, RBAC_SUPERADMIN_ASSIGNER_ROLES);
}

export function canActorAssignDeveloperRole(actorRole: string | undefined): boolean {
  return actorRole === USER_ROLES.DEVELOPER;
}

export function assertRoleAssignmentAllowed(
  actorRole: string | undefined,
  newRole: string,
  targetRole?: string,
): { ok: true } | { ok: false; error: string } {
  if (!canActorEditUserRoles(actorRole)) {
    return { ok: false, error: "Only ADMIN, SUPERADMIN, or DEVELOPER users can edit user roles" };
  }

  if (actorRole === USER_ROLES.ADMIN) {
    if (newRole === USER_ROLES.SUPERADMIN) {
      return { ok: false, error: "ADMIN users cannot assign the SUPERADMIN role" };
    }
    if (newRole === USER_ROLES.DEVELOPER) {
      return { ok: false, error: "ADMIN users cannot assign the DEVELOPER role" };
    }
    if (targetRole && isRbacRoleAllowed(targetRole, RBAC_ADMIN_IMMUTABLE_TARGET_ROLES)) {
      return { ok: false, error: "ADMIN users cannot change roles for SUPERADMIN or DEVELOPER accounts" };
    }
  }

  if (actorRole === USER_ROLES.SUPERADMIN) {
    if (newRole === USER_ROLES.DEVELOPER) {
      return { ok: false, error: "Only DEVELOPER users can assign the DEVELOPER role" };
    }
    if (targetRole === USER_ROLES.DEVELOPER) {
      return { ok: false, error: "Only DEVELOPER users can change DEVELOPER account roles" };
    }
  }

  return { ok: true };
}
