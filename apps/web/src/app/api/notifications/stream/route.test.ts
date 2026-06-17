import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "./route";

const {
  callBackendMock,
  readAuthCookiesMock,
  refreshSessionMock,
  setAuthCookiesMock,
} = vi.hoisted(() => ({
  callBackendMock: vi.fn(),
  readAuthCookiesMock: vi.fn(),
  refreshSessionMock: vi.fn(),
  setAuthCookiesMock: vi.fn(),
}));

vi.mock("@/lib/auth/cookies", () => ({
  readAuthCookies: readAuthCookiesMock,
  setAuthCookies: setAuthCookiesMock,
}));

vi.mock("@/lib/server/backend", () => ({
  callBackend: callBackendMock,
  refreshSession: refreshSessionMock,
}));

describe("notifications stream route", () => {
  beforeEach(() => {
    readAuthCookiesMock.mockResolvedValue({
      accessToken: "expired-access-token",
      refreshToken: "refresh-token",
      csrfToken: "csrf-token",
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("persists rotated cookies after refreshing the SSE stream", async () => {
    callBackendMock
      .mockResolvedValueOnce(
        new Response("unauthorized", {
          status: 401,
          headers: {
            "content-type": "text/plain",
          },
        }),
      )
      .mockResolvedValueOnce(
        new Response("event: ping\ndata: ok\n\n", {
          status: 200,
          headers: {
            "content-type": "text/event-stream",
          },
        }),
      );
    refreshSessionMock.mockResolvedValue({
      data: {
        accessToken: "fresh-access-token",
        refreshToken: "fresh-refresh-token",
      },
    });

    const response = await GET();

    expect(response.status).toBe(200);
    expect(setAuthCookiesMock).toHaveBeenCalledWith(
      response,
      {
        accessToken: "fresh-access-token",
        refreshToken: "fresh-refresh-token",
      },
      "csrf-token",
    );
  });
});
