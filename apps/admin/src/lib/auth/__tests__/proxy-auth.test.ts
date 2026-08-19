import { describe, expect, it } from "vitest";

import { resolveAdminProxy, splitLocale } from "../proxy-auth";

describe("splitLocale", () => {
  it("splits a locale-prefixed path", () => {
    expect(splitLocale("/vi/users")).toEqual({
      locale: "vi",
      pathname: "/users",
    });
  });

  it("treats a bare locale as the root path", () => {
    expect(splitLocale("/en")).toEqual({ locale: "en", pathname: "/" });
  });

  it("falls back to the default locale for unprefixed paths", () => {
    expect(splitLocale("/users")).toEqual({
      locale: "en",
      pathname: "/users",
    });
  });
});

describe("resolveAdminProxy", () => {
  it("redirects a protected route to the locale's login when the cookie is absent", () => {
    expect(resolveAdminProxy({ pathname: "/vi/users", hasRefreshToken: false })).toEqual({
      action: "redirect",
      to: "/vi/login",
    });
  });

  it("redirects unprefixed protected routes to the default-locale login", () => {
    expect(resolveAdminProxy({ pathname: "/users", hasRefreshToken: false })).toEqual({
      action: "redirect",
      to: "/en/login",
    });
  });

  it("lets a protected route through when the refresh cookie is present", () => {
    expect(resolveAdminProxy({ pathname: "/en/users", hasRefreshToken: true })).toEqual({
      action: "next",
    });
  });

  it("redirects the dashboard root when unauthenticated", () => {
    expect(resolveAdminProxy({ pathname: "/en", hasRefreshToken: false })).toEqual({
      action: "redirect",
      to: "/en/login",
    });
  });

  it("never redirects the login page, even without a cookie", () => {
    expect(resolveAdminProxy({ pathname: "/vi/login", hasRefreshToken: false })).toEqual({
      action: "next",
    });
  });

  it("never redirects the SSO callback, which runs before a session exists", () => {
    expect(
      resolveAdminProxy({
        pathname: "/en/login/sso/callback",
        hasRefreshToken: false,
      }),
    ).toEqual({ action: "next" });
  });
});
