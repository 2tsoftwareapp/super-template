import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createAuthCookieHelpers } from "@repo/web-core/auth/cookies";
import { createBackendHelpers } from "@repo/web-core/server";

describe("createBackendHelpers mutation guards", () => {
  const auth = createAuthCookieHelpers({
    cookieSecure: false,
    csrfSecret: "test-csrf-secret",
    cookieNames: {
      accessToken: "st_test_access",
      refreshToken: "st_test_refresh",
      csrf: "st_test_csrf",
    },
  });

  const backend = createBackendHelpers({
    apiInternalUrl: "http://localhost:3001",
    allowedOrigins: ["http://localhost:3000"],
    auth,
  });

  beforeEach(() => {
    vi.spyOn(auth, "readAuthCookies").mockResolvedValue({
      accessToken: null,
      refreshToken: null,
      csrfToken: "valid-csrf-token",
    });
    vi.spyOn(auth, "isValidCsrfToken").mockReturnValue(true);
  });

  it("rejects mutations from disallowed origins", async () => {
    const request = new NextRequest("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: {
        origin: "http://evil.example.com",
        "x-csrf-token": "valid-csrf-token",
      },
    });

    const response = await backend.enforceMutationGuard(request);

    expect(response?.status).toBe(403);
  });

  it("rejects pre-session mutations without a matching csrf token", async () => {
    const request = new NextRequest("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: {
        origin: "http://localhost:3000",
        "x-csrf-token": "wrong-token",
      },
    });

    const response = await backend.enforceMutationGuard(request);

    expect(response?.status).toBe(403);
  });

  it("allows pre-session mutations with origin and csrf checks", async () => {
    const request = new NextRequest("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: {
        origin: "http://localhost:3000",
        "x-csrf-token": "valid-csrf-token",
      },
    });

    const response = await backend.enforceMutationGuard(request);

    expect(response).toBeNull();
  });

  it("allows establish-session with origin check only", () => {
    const request = new NextRequest(
      "http://localhost:3000/api/auth/sso/establish-session",
      {
        method: "POST",
        headers: {
          origin: "http://localhost:3000",
        },
      },
    );

    const response = backend.enforceOrigin(request);

    expect(response).toBeNull();
  });
});
