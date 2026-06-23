import {
  canActorAssignDeveloperRole,
  canActorAssignSuperAdminRole,
  canActorEditUserRoles,
  isRbacRoleAllowed,
  RBAC_ADMIN_IMMUTABLE_TARGET_ROLES,
} from "@/lib/rbac";
import { USER_ROLES, UserRole } from "@/lib/types";

export function getAvailableRoles(
  mode: "add" | "edit",
  actorRole: string | undefined,
  currentRole?: UserRole,
): UserRole[] {
  const canEditRoles = canActorEditUserRoles(actorRole);

  if (mode === "add") {
    const baseRoles: UserRole[] = [USER_ROLES.MEMBER, USER_ROLES.TEACHER, USER_ROLES.ADMIN];
    if (canActorAssignSuperAdminRole(actorRole)) {
      baseRoles.push(USER_ROLES.SUPERADMIN);
    }
    if (canActorAssignDeveloperRole(actorRole)) {
      baseRoles.push(USER_ROLES.DEVELOPER);
    }
    return baseRoles;
  }

  if (!canEditRoles) {
    return currentRole ? [currentRole] : [USER_ROLES.MEMBER];
  }

  if (
    actorRole === USER_ROLES.ADMIN &&
    currentRole &&
    isRbacRoleAllowed(currentRole, RBAC_ADMIN_IMMUTABLE_TARGET_ROLES)
  ) {
    return [currentRole];
  }

  const roles: UserRole[] = [USER_ROLES.MEMBER, USER_ROLES.TEACHER, USER_ROLES.ADMIN];
  if (canActorAssignSuperAdminRole(actorRole)) {
    roles.push(USER_ROLES.SUPERADMIN);
  }
  if (canActorAssignDeveloperRole(actorRole)) {
    roles.push(USER_ROLES.DEVELOPER);
  }
  return roles;
}
