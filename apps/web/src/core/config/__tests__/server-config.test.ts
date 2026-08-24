import { beforeEach, describe, expect, it, vi } from "vitest";

const envMock = vi.hoisted(() => ({
  serverEnv: {
    API_INTERNAL_URL: "http://localhost:3001",
    WEB_ORIGIN: " http://localhost:3000 , https://example.com ",
    COOKIE_DOMAIN: undefined as string | undefined,
    COOKIE_SAMESITE: "lax" as const,
    CSRF_SECRET: undefined as string | undefined,
    COOKIE_SECURE: undefined as boolean | undefined,
    APP_ENV: "test" as "development" | "test" | "staging" | "production",
    NODE_ENV: "test" as const,
  },
}));

vi.mock("../server-env", () => envMock);

describe("serverConfig", () => {
  beforeEach(() => {
    envMock.serverEnv.WEB_ORIGIN = " http://localhost:3000 , https://example.com ";
    envMock.serverEnv.COOKIE_SECURE = undefined;
    envMock.serverEnv.APP_ENV = "test";
    envMock.serverEnv.CSRF_SECRET = undefined;
    vi.resetModules();
  });

  it("normalizes backend origins once at the configuration boundary", async () => {
    const { serverConfig } = await import("../server-config");

    expect(serverConfig.backend).toEqual({
      apiInternalUrl: "http://localhost:3001",
      allowedOrigins: ["http://localhost:3000", "https://example.com"],
    });
  });

  it("keeps cookies insecure by default in test/development", async () => {
    const { serverConfig } = await import("../server-config");

    expect(serverConfig.auth.cookieSecure).toBe(false);
    expect(serverConfig.auth.requireSignedCsrf).toBe(false);
  });

  it("enforces secure cookies and signed csrf by default in production", async () => {
    envMock.serverEnv.APP_ENV = "production";

    const { serverConfig } = await import("../server-config");

    expect(serverConfig.auth.cookieSecure).toBe(true);
    expect(serverConfig.auth.requireSignedCsrf).toBe(true);
  });

  it("honors an explicit cookie-secure override", async () => {
    envMock.serverEnv.APP_ENV = "production";
    envMock.serverEnv.COOKIE_SECURE = false;

    const { serverConfig } = await import("../server-config");

    expect(serverConfig.auth.cookieSecure).toBe(false);
  });
});
