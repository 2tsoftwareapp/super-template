import { describe, expect, it } from "vitest";

import type { SessionUser } from "@/lib/api-types";

import { resolveAdminGuard } from "./admin-guard.state";

const adminUser: SessionUser = {
  id: "u1",
  displayName: "Admin",
  email: "admin@example.local",
  roles: ["ADMIN"],
};

const outsiderUser: SessionUser = {
  id: "u2",
  displayName: "Outsider",
  email: "outsider@example.local",
  roles: ["USER"],
};

describe("resolveAdminGuard", () => {
  it("stays in loading while the session is loading", () => {
    expect(
      resolveAdminGuard({
        isLoading: true,
        user: undefined,
        permissions: undefined,
        organizationId: "org-1",
        pathname: "/",
      }),
    ).toEqual({ status: "loading" });
  });

  it("redirects to login when there is no user after loading", () => {
    expect(
      resolveAdminGuard({
        isLoading: false,
        user: undefined,
        permissions: undefined,
        organizationId: "org-1",
        pathname: "/",
      }),
    ).toEqual({ status: "redirect-login" });
  });

  it("signs out an authenticated user who lacks admin access", () => {
    expect(
      resolveAdminGuard({
        isLoading: false,
        user: outsiderUser,
        permissions: [],
        organizationId: "org-1",
        pathname: "/",
      }),
    ).toEqual({ status: "sign-out" });
  });

  it("redirects to the first accessible resource when the current route is forbidden", () => {
    expect(
      resolveAdminGuard({
        isLoading: false,
        user: adminUser,
        permissions: ["users.read"],
        organizationId: "org-1",
        pathname: "/roles",
      }),
    ).toEqual({ status: "redirect-resource", path: "/users" });
  });

  it("is ready when the user has admin access and route permission", () => {
    const decision = resolveAdminGuard({
      isLoading: false,
      user: adminUser,
      permissions: ["users.read"],
      organizationId: "org-1",
      pathname: "/users",
    });

    expect(decision).toEqual({
      status: "ready",
      user: adminUser,
      permissions: ["users.read"],
      organizationId: "org-1",
    });
  });

  it("treats the permission-less dashboard as accessible for any admin user", () => {
    const decision = resolveAdminGuard({
      isLoading: false,
      user: adminUser,
      permissions: ["users.read"],
      organizationId: "org-1",
      pathname: "/",
    });

    expect(decision.status).toBe("ready");
  });
});
