import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApiClientError } from "@/lib/http";

import { verifyEmailToken } from "./verify-email-service";

vi.mock("@/lib/http", async () => {
  const actual = await vi.importActual<typeof import("@/lib/http")>("@/lib/http");
  return {
    ...actual,
    webFetch: vi.fn(),
  };
});

const { webFetch } = await import("@/lib/http");
const webFetchMock = vi.mocked(webFetch);

beforeEach(() => {
  webFetchMock.mockReset();
});

describe("verifyEmailToken", () => {
  it("returns ok with a success message when the API accepts the token", async () => {
    webFetchMock.mockResolvedValueOnce({ data: {} });

    const result = await verifyEmailToken("valid-token");

    expect(result.ok).toBe(true);
    expect(result.message).toMatch(/verified successfully/i);
  });

  it("surfaces the API error message on rejection", async () => {
    webFetchMock.mockRejectedValueOnce(
      new ApiClientError(400, {
        error: { code: "BAD", message: "Token expired", details: null },
        meta: { requestId: "r1" },
      }),
    );

    const result = await verifyEmailToken("expired-token");

    expect(result).toEqual({ ok: false, message: "Token expired" });
  });

  it("falls back to a generic message when the API gives no detail", async () => {
    webFetchMock.mockRejectedValueOnce(new ApiClientError(400, null));

    const result = await verifyEmailToken("bad-token");

    expect(result.ok).toBe(false);
    expect(result.message.length).toBeGreaterThan(0);
  });

  it("reports a network error when fetch throws a TypeError", async () => {
    webFetchMock.mockRejectedValueOnce(new TypeError("Failed to fetch"));

    const result = await verifyEmailToken("any-token");

    expect(result).toEqual({
      ok: false,
      message: "Network error. Please try again.",
    });
  });

  it("posts the token to the BFF verify endpoint via webFetch", async () => {
    webFetchMock.mockResolvedValueOnce({ data: {} });

    await verifyEmailToken("tok-123");

    expect(webFetchMock).toHaveBeenCalledWith(
      "/api/auth/verify-email",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ token: "tok-123" }),
      }),
    );
  });
});
