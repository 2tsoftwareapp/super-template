import { beforeEach, describe, expect, it, vi } from "vitest";

interface MockEnv {
  APP_ENV: "development" | "test" | "staging" | "production";
  COOKIE_DOMAIN: undefined;
  COOKIE_SAMESITE: "lax";
  CSRF_SECRET: string | undefined;
  NODE_ENV: "test";
}

const envMock: { env: MockEnv; isSecureCookie: boolean } = vi.hoisted(() => ({
  env: {
    APP_ENV: "test",
    COOKIE_DOMAIN: undefined,
    COOKIE_SAMESITE: "lax",
    CSRF_SECRET: "test-csrf-secret",
    NODE_ENV: "test",
  },
  isSecureCookie: false,
}));

vi.mock("@/lib/env", () => envMock);

describe("csrf cookies", () => {
  beforeEach(() => {
    envMock.env.APP_ENV = "test";
    envMock.env.CSRF_SECRET = "test-csrf-secret";
    vi.resetModules();
  });

  it("uses web-specific cookie names", async () => {
    const {
      ACCESS_TOKEN_COOKIE,
      REFRESH_TOKEN_COOKIE,
      CSRF_TOKEN_COOKIE,
    } = await import("./cookies");

    expect(ACCESS_TOKEN_COOKIE).toBe("st_web_access_token");
    expect(REFRESH_TOKEN_COOKIE).toBe("st_web_refresh_token");
    expect(CSRF_TOKEN_COOKIE).toBe("st_web_csrf");
  });

  it("signs and validates csrf tokens when a secret is configured", async () => {
    const { createCsrfToken, isValidCsrfToken } = await import("./cookies");

    const token = createCsrfToken();

    expect(token).toMatch(/^[0-9a-f-]+\.[A-Za-z0-9_-]+$/i);
    expect(isValidCsrfToken(token)).toBe(true);
    expect(isValidCsrfToken(`${token}x`)).toBe(false);
  });

  it("accepts any non-empty token when no secret is configured in development", async () => {
    envMock.env.APP_ENV = "development";
    envMock.env.CSRF_SECRET = undefined;

    const { isValidCsrfToken } = await import("./cookies");

    expect(isValidCsrfToken("csrf-token")).toBe(true);
    expect(isValidCsrfToken("")).toBe(false);
  });

  it("rejects unsigned tokens in staging when no secret is configured", async () => {
    envMock.env.APP_ENV = "staging";
    envMock.env.CSRF_SECRET = undefined;

    const { isValidCsrfToken } = await import("./cookies");

    expect(isValidCsrfToken("csrf-token")).toBe(false);
  });
});
