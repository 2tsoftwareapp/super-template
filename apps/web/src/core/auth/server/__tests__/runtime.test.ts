import { beforeEach, describe, expect, it, vi } from "vitest";

interface AuthConfigMock {
  cookieDomain: string | undefined;
  cookieSameSite: "lax";
  cookieSecure: boolean;
  csrfSecret: string | null;
  requireSignedCsrf: boolean;
}

const configMock = vi.hoisted<{ serverConfig: { auth: AuthConfigMock } }>(() => {
  return {
    serverConfig: {
      auth: {
        cookieDomain: undefined,
        cookieSameSite: "lax" as const,
        cookieSecure: false,
        csrfSecret: "test-csrf-secret",
        requireSignedCsrf: false,
      },
    },
  };
});

vi.mock("@/core/config/server-config", () => configMock);

describe("auth runtime", () => {
  beforeEach(() => {
    configMock.serverConfig.auth.csrfSecret = "test-csrf-secret";
    configMock.serverConfig.auth.requireSignedCsrf = false;
    vi.resetModules();
  });

  it("uses web-specific cookie names", async () => {
    const { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE, CSRF_TOKEN_COOKIE } = await import(
      "@/core/auth/cookie-names"
    );

    expect(ACCESS_TOKEN_COOKIE).toBe("st_web_access_token");
    expect(REFRESH_TOKEN_COOKIE).toBe("st_web_refresh_token");
    expect(CSRF_TOKEN_COOKIE).toBe("st_web_csrf");
  });

  it("signs and validates csrf tokens when a secret is configured", async () => {
    const { authRuntime } = await import("../runtime");
    const token = authRuntime.createCsrfToken();

    expect(token).toMatch(/^[0-9a-f-]+\.[A-Za-z0-9_-]+$/i);
    expect(authRuntime.isValidCsrfToken(token)).toBe(true);
    expect(authRuntime.isValidCsrfToken(`${token}x`)).toBe(false);
  });

  it("accepts any non-empty token when signed csrf is not required", async () => {
    configMock.serverConfig.auth.csrfSecret = null;
    configMock.serverConfig.auth.requireSignedCsrf = false;

    const { authRuntime } = await import("../runtime");

    expect(authRuntime.isValidCsrfToken("csrf-token")).toBe(true);
    expect(authRuntime.isValidCsrfToken("")).toBe(false);
  });

  it("rejects unsigned tokens when signed csrf is required", async () => {
    configMock.serverConfig.auth.csrfSecret = null;
    configMock.serverConfig.auth.requireSignedCsrf = true;

    const { authRuntime } = await import("../runtime");

    expect(authRuntime.isValidCsrfToken("csrf-token")).toBe(false);
  });
});
