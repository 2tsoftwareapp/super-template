import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { ApiEnvelope } from "@/lib/api-types";

import { proxyWithRefresh } from "./backend";

const { readAuthCookiesMock, setAuthCookiesMock, clearAuthCookiesMock } =
  vi.hoisted(() => ({
    readAuthCookiesMock: vi.fn(),
    setAuthCookiesMock: vi.fn(),
    clearAuthCookiesMock: vi.fn(),
  }));

vi.mock("@/lib/env", () => ({
  env: {
    API_INTERNAL_URL: "http://localhost:3001",
    NEXT_PUBLIC_WEB_URL: "http://localhost:3000",
    WEB_ORIGIN: "http://localhost:3000",
    COOKIE_DOMAIN: undefined,
    COOKIE_SAMESITE: "lax",
    COOKIE_SECURE: false,
    NODE_ENV: "test",
  },
  isSecureCookie: false,
}));

vi.mock("@/lib/auth/cookies", () => ({
  readAuthCookies: readAuthCookiesMock,
  setAuthCookies: setAuthCookiesMock,
  clearAuthCookies: clearAuthCookiesMock,
}));

describe("proxyWithRefresh", () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    readAuthCookiesMock.mockResolvedValue({
      accessToken: "stale-access-token",
      refreshToken: "refresh-token",
      csrfToken: "csrf-token",
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("refreshes once on an eligible 401 and rotates cookies with the new tokens", async () => {
    fetchMock
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            error: {
              code: "AUTH_UNAUTHORIZED",
              message: "expired",
              details: null,
            },
            meta: { requestId: "first" },
          }),
          {
            status: 401,
            headers: { "content-type": "application/json" },
          },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            data: {
              accessToken: "fresh-access-token",
              refreshToken: "fresh-refresh-token",
            },
          }),
          {
            status: 200,
            headers: { "content-type": "application/json" },
          },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            data: [{ id: "project-1" }],
            meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
          }),
          {
            status: 200,
            headers: { "content-type": "application/json" },
          },
        ),
      );

    const request = new NextRequest("http://localhost/api/bff/projects", {
      method: "GET",
      headers: {
        accept: "application/json",
      },
    });

    const response = await proxyWithRefresh(request, "projects");
    const payload = (await response.json()) as ApiEnvelope<{ id: string }[]>;

    expect(response.status).toBe(200);
    expect(payload.data).toEqual([{ id: "project-1" }]);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(setAuthCookiesMock).toHaveBeenCalledWith(
      response,
      {
        accessToken: "fresh-access-token",
        refreshToken: "fresh-refresh-token",
      },
      "csrf-token",
    );
    expect(clearAuthCookiesMock).not.toHaveBeenCalled();
  });

  it("clears cookies when refresh is not possible", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          error: {
            code: "AUTH_UNAUTHORIZED",
            message: "expired",
            details: null,
          },
          meta: { requestId: "req-1" },
        }),
        {
          status: 401,
          headers: { "content-type": "application/json" },
        },
      ),
    );

    readAuthCookiesMock.mockResolvedValueOnce({
      accessToken: "expired-access-token",
      refreshToken: null,
      csrfToken: "csrf-token",
    });

    const request = new NextRequest("http://localhost/api/auth/session", {
      method: "GET",
      headers: {
        accept: "application/json",
      },
    });

    const response = await proxyWithRefresh(request, "auth/me");

    expect(response.status).toBe(401);
    expect(clearAuthCookiesMock).toHaveBeenCalledWith(response);
    expect(setAuthCookiesMock).not.toHaveBeenCalled();
  });

  it("normalizes list-route query params before proxying to the backend", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          data: [],
          meta: { page: 2, limit: 5, total: 0, totalPages: 0 },
        }),
        {
          status: 200,
          headers: { "content-type": "application/json" },
        },
      ),
    );

    const request = new NextRequest(
      "http://localhost/api/bff/projects?page=2&limit=5&status=ACTIVE&sortField=name&sortOrder=asc&unknown=drop-me",
      {
        method: "GET",
        headers: {
          accept: "application/json",
        },
      },
    );

    const response = await proxyWithRefresh(request, "projects");

    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const firstCall = fetchMock.mock.calls[0];
    expect(firstCall).toBeDefined();
    const [url] = firstCall!;
    const requestUrl =
      typeof url === "string"
        ? url
        : url instanceof URL
          ? url.href
          : "";

    expect(requestUrl).toContain(
      "/api/v1/projects?page=2&limit=5&status=ACTIVE&sortField=name&sortOrder=asc",
    );
    expect(requestUrl).not.toContain("unknown=drop-me");
  });
});
