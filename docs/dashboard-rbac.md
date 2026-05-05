# Dashboard RBAC (SUPERADMIN, ADMIN, TEACHER)

**DEVELOPER** is treated like SUPERADMIN for most admin APIs and nav, except **Brands** (sidebar: DEVELOPER only).

Canonical role constants live in [`src/lib/rbac.ts`](../src/lib/rbac.ts). Navigation visibility is driven by `requiredRoles` on items in [`src/navigation/sidebar/sidebar-items.ts`](../src/navigation/sidebar/sidebar-items.ts); the command palette applies the same rules in [`src/app/(main)/dashboard/_components/sidebar/search-dialog.tsx`](../src/app/(main)/dashboard/_components/sidebar/search-dialog.tsx).

## Post–sign-in redirect

Roles in `RBAC_DEFAULT_DASHBOARD_REDIRECT_ROLES` (ADMIN, SUPERADMIN, DEVELOPER, TEACHER) are sent to `/dashboard/home` after login/register; others go to `/public`. Implemented in [`src/middleware.ts`](../src/middleware.ts) and auth forms.

## Menu visibility (sidebar / search)

| Area | SUPERADMIN | ADMIN | TEACHER |
|------|------------|-------|---------|
| Home, CRM | yes | yes | yes |
| Users & Membership | yes | yes | no |
| Classes (items) | yes | no | no |
| Products | yes | no | no |
| Sessions | yes | yes | yes (read-only UI + API scoped to assigned sessions) |
| Finance → Overview | yes | yes | no |
| Finance → Payroll | yes | yes | yes (read-only UI; summary cards hidden; API scoped to self) |
| Finance → Transactions | yes | yes | no |
| Brands | no (DEVELOPER only in nav) | no | no |
| Settings (Booking, Waiver) | yes | yes | no |

## Server enforcement highlights

- **User directory CRUD** [`src/app/api/users/route.ts`](../src/app/api/users/route.ts), [`src/app/api/users/[id]/route.ts`](../src/app/api/users/[id]/route.ts): `requireAdmin()` on GET list, GET by id, POST, PATCH, DELETE.
- **Sessions list** [`src/app/api/admin/sessions/route.ts`](../src/app/api/admin/sessions/route.ts): TEACHER allowed on GET; `teacherId` forced to current user for TEACHER. Mutations remain admin-only.
- **Session detail** [`src/app/api/admin/sessions/[id]/route.ts`](../src/app/api/admin/sessions/[id]/route.ts): GET allowed for TEACHER only when `classSession.teacherId === session.user.id`. PUT remains admin-only.
- **Bookings on a session** [`src/app/api/admin/sessions/[id]/bookings/route.ts`](../src/app/api/admin/sessions/[id]/bookings/route.ts): GET allowed for TEACHER for own session; POST/PATCH admin-only.
- **Payroll summary** [`src/app/api/admin/payroll/summary/route.ts`](../src/app/api/admin/payroll/summary/route.ts): TEACHER allowed on GET with `teacherId` forced to self; teacher-fees config routes remain admin-only.
- **Private sessions** [`src/app/api/admin/private-sessions/route.ts`](../src/app/api/admin/private-sessions/route.ts): GET/POST restricted to `RBAC_PRIVATE_SESSION_ADMIN_ROLES` (admin operators only).

## Shared guards

[`src/lib/api-utils.ts`](../src/lib/api-utils.ts): `requireAdmin` / `requireSuperAdmin` use `RBAC_ADMIN_ROLES` / `RBAC_SUPERADMIN_EDGE_ROLES` from `rbac.ts`.

## Client guards

[`src/components/role-guard.tsx`](../src/components/role-guard.tsx): per-page `allowedRoles` (e.g. payroll uses `RBAC_PAYROLL_MENU_ROLES`). This is a client redirect only; APIs must still enforce scope as above.
