import { describe, expect, it } from "vitest";

import {
  DASHBOARD_HOME_PATH,
  PUBLIC_HOME_PATH,
  buildAuthContinueUrl,
  getPostAuthRedirectPath,
  normalizeDashboardCallbackPath,
} from "@/lib/auth-session";
import { USER_ROLES } from "@/lib/types";

describe("getPostAuthRedirectPath", () => {
  it("sends members to /public regardless of callbackUrl", () => {
    expect(getPostAuthRedirectPath(USER_ROLES.MEMBER)).toBe(PUBLIC_HOME_PATH);
    expect(getPostAuthRedirectPath(USER_ROLES.MEMBER, "/dashboard/home")).toBe(PUBLIC_HOME_PATH);
    expect(getPostAuthRedirectPath(USER_ROLES.MEMBER, "/dashboard/users")).toBe(PUBLIC_HOME_PATH);
  });

  it("sends admin roles to /dashboard/home by default", () => {
    expect(getPostAuthRedirectPath(USER_ROLES.ADMIN)).toBe(DASHBOARD_HOME_PATH);
    expect(getPostAuthRedirectPath(USER_ROLES.SUPERADMIN)).toBe(DASHBOARD_HOME_PATH);
  });

  it("honors safe dashboard callback URLs for admin roles", () => {
    expect(getPostAuthRedirectPath(USER_ROLES.ADMIN, "/dashboard/users")).toBe("/dashboard/users");
    expect(getPostAuthRedirectPath(USER_ROLES.SUPERADMIN, "/dashboard/admin/brands")).toBe("/dashboard/admin/brands");
  });

  it("normalizes /dashboard to /dashboard/home", () => {
    expect(normalizeDashboardCallbackPath("/dashboard")).toBe(DASHBOARD_HOME_PATH);
    expect(getPostAuthRedirectPath(USER_ROLES.ADMIN, "/dashboard")).toBe(DASHBOARD_HOME_PATH);
  });

  it("ignores unsafe callback URLs for admin roles", () => {
    expect(getPostAuthRedirectPath(USER_ROLES.ADMIN, "https://evil.test")).toBe(DASHBOARD_HOME_PATH);
    expect(getPostAuthRedirectPath(USER_ROLES.ADMIN, "/public")).toBe(DASHBOARD_HOME_PATH);
  });
});

describe("buildAuthContinueUrl", () => {
  it("returns base path when callbackUrl is missing or unsafe", () => {
    expect(buildAuthContinueUrl()).toBe("/auth/continue");
    expect(buildAuthContinueUrl(null)).toBe("/auth/continue");
    expect(buildAuthContinueUrl("https://evil.test")).toBe("/auth/continue");
  });

  it("encodes safe internal callback URLs", () => {
    expect(buildAuthContinueUrl("/dashboard/users")).toBe("/auth/continue?callbackUrl=%2Fdashboard%2Fusers");
  });
});
