import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import { createAuthCookieHelpers } from "@repo/web-server/auth/cookies";
import { createBackendHelpers } from "@repo/web-server/server";

function createHarness() {
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

  return { auth, backend };
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

const refreshEnvelope = {
  data: {
    accessToken: "new-access",
    refreshToken: "new-refresh",
  },
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("refreshSession single-flight", () => {
  it("shares one backend refresh call across concurrent callers", async () => {
    const { backend } = createHarness();
    let resolveRefresh: (response: Response) => void = () => undefined;
    const fetchMock = vi.fn().mockImplementation(
      () =>
        new Promise<Response>((resolve) => {
          resolveRefresh = resolve;
        }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const first = backend.refreshSession("same-token");
    const second = backend.refreshSession("same-token");

    expect(fetchMock).toHaveBeenCalledTimes(1);

    resolveRefresh(jsonResponse(refreshEnvelope));
    const [a, b] = await Promise.all([first, second]);

    expect(a?.data.accessToken).toBe("new-access");
    expect(b?.data.accessToken).toBe("new-access");
  });

  it("does not share flights between different refresh tokens", async () => {
    const { backend } = createHarness();
    const fetchMock = vi
      .fn()
      .mockImplementation(() => Promise.resolve(jsonResponse(refreshEnvelope)));
    vi.stubGlobal("fetch", fetchMock);

    await Promise.all([
      backend.refreshSession("token-a"),
      backend.refreshSession("token-b"),
    ]);

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("allows a fresh refresh call after the previous flight settles", async () => {
    const { backend } = createHarness();
    const fetchMock = vi
      .fn()
      .mockImplementation(() => Promise.resolve(jsonResponse(refreshEnvelope)));
    vi.stubGlobal("fetch", fetchMock);

    await backend.refreshSession("same-token");
    await backend.refreshSession("same-token");

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("returns null (and releases the flight) when the backend rejects the token", async () => {
    const { backend } = createHarness();
    const fetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse({ error: { code: "X" } }, 401));
    vi.stubGlobal("fetch", fetchMock);

    await expect(backend.refreshSession("stale")).resolves.toBeNull();
  });
});

describe("proxyWithRefresh", () => {
  function stubCookies(
    auth: ReturnType<typeof createAuthCookieHelpers>,
    values: {
      accessToken: string | null;
      refreshToken: string | null;
    },
  ) {
    vi.spyOn(auth, "readAuthCookies").mockResolvedValue({
      ...values,
      csrfToken: "csrf",
    });
  }

  const proxiedRequest = () =>
    new NextRequest("http://localhost:3000/api/bff/admin/users", {
      method: "GET",
    });

  it("retries with the refreshed access token after a 401", async () => {
    const { auth, backend } = createHarness();
    stubCookies(auth, { accessToken: "expired", refreshToken: "refresh-1" });

    const fetchMock = vi
      .fn()
      // 1) proxied call with expired token
      .mockResolvedValueOnce(jsonResponse({ error: { code: "AUTH" } }, 401))
      // 2) auth/refresh
      .mockResolvedValueOnce(jsonResponse(refreshEnvelope))
      // 3) retried proxied call
      .mockResolvedValueOnce(jsonResponse({ data: { ok: true } }));
    vi.stubGlobal("fetch", fetchMock);

    const response = await backend.proxyWithRefresh(
      proxiedRequest(),
      "admin/users",
    );

    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    const retryHeaders = new Headers(
      (fetchMock.mock.calls[2]?.[1] as RequestInit).headers,
    );
    expect(retryHeaders.get("authorization")).toBe("Bearer new-access");
    // refreshed tokens are written back as cookies
    expect(response.headers.getSetCookie().join(";")).toContain("new-refresh");
  });

  it("clears auth cookies when the refresh is rejected", async () => {
    const { auth, backend } = createHarness();
    stubCookies(auth, { accessToken: "expired", refreshToken: "stale" });

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ error: { code: "AUTH" } }, 401))
      .mockResolvedValueOnce(jsonResponse({ error: { code: "REUSED" } }, 401));
    vi.stubGlobal("fetch", fetchMock);

    const response = await backend.proxyWithRefresh(
      proxiedRequest(),
      "admin/users",
    );

    expect(response.status).toBe(401);
    const setCookies = response.headers.getSetCookie().join(";");
    expect(setCookies).toContain("st_test_access=;");
  });

  it("passes non-401 responses through without refreshing", async () => {
    const { auth, backend } = createHarness();
    stubCookies(auth, { accessToken: "ok", refreshToken: "refresh-1" });

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ data: { ok: true } }));
    vi.stubGlobal("fetch", fetchMock);

    const response = await backend.proxyWithRefresh(
      proxiedRequest(),
      "admin/users",
    );

    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
