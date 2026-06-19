import { beforeEach, describe, expect, it, vi } from "vitest";

interface MockEnv {
  COOKIE_DOMAIN: undefined;
  COOKIE_SAMESITE: "lax";
  CSRF_SECRET: string | undefined;
  NODE_ENV: "test";
}

const envMock: { env: MockEnv; isSecureCookie: boolean } = vi.hoisted(() => ({
  env: {
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
    vi.resetModules();
  });

  it("signs and validates csrf tokens when a secret is configured", async () => {
    const { createCsrfToken, isValidCsrfToken } = await import("./cookies");

    const token = createCsrfToken();

    expect(token).toMatch(/^[0-9a-f-]+\.[A-Za-z0-9_-]+$/i);
    expect(isValidCsrfToken(token)).toBe(true);
    expect(isValidCsrfToken(`${token}x`)).toBe(false);
  });

  it("accepts any non-empty token when no secret is configured", async () => {
    envMock.env.CSRF_SECRET = undefined;

    const { isValidCsrfToken } = await import("./cookies");

    expect(isValidCsrfToken("csrf-token")).toBe(true);
    expect(isValidCsrfToken("")).toBe(false);
  });
});
