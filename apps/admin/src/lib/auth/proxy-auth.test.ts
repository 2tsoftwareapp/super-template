import { describe, expect, it } from "vitest";

import { resolveAdminProxy } from "./proxy-auth";

describe("resolveAdminProxy", () => {
  it("redirects a protected route to /login when the refresh cookie is absent", () => {
    expect(
      resolveAdminProxy({ pathname: "/users", hasRefreshToken: false }),
    ).toEqual({ action: "redirect", to: "/login" });
  });

  it("lets a protected route through when the refresh cookie is present", () => {
    expect(
      resolveAdminProxy({ pathname: "/users", hasRefreshToken: true }),
    ).toEqual({ action: "next" });
  });

  it("redirects the dashboard root when unauthenticated", () => {
    expect(
      resolveAdminProxy({ pathname: "/", hasRefreshToken: false }),
    ).toEqual({ action: "redirect", to: "/login" });
  });

  it("never redirects the login page, even without a cookie", () => {
    expect(
      resolveAdminProxy({ pathname: "/login", hasRefreshToken: false }),
    ).toEqual({ action: "next" });
  });

  it("never redirects the SSO callback, which runs before a session exists", () => {
    expect(
      resolveAdminProxy({
        pathname: "/login/sso/callback",
        hasRefreshToken: false,
      }),
    ).toEqual({ action: "next" });
  });
});
