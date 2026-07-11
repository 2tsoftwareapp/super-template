import { afterEach, describe, expect, it, vi } from "vitest";

import { verifyEmailToken } from "./verify-email-service";

function mockFetchOnce(response: {
  ok: boolean;
  json: () => Promise<unknown>;
}) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(response),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("verifyEmailToken", () => {
  it("returns ok with a success message when the API accepts the token", async () => {
    mockFetchOnce({ ok: true, json: () => Promise.resolve({}) });

    const result = await verifyEmailToken("valid-token");

    expect(result.ok).toBe(true);
    expect(result.message).toMatch(/verified successfully/i);
  });

  it("surfaces the API error message on rejection", async () => {
    mockFetchOnce({
      ok: false,
      json: () =>
        Promise.resolve({ error: { message: "Token expired" } }),
    });

    const result = await verifyEmailToken("expired-token");

    expect(result).toEqual({ ok: false, message: "Token expired" });
  });

  it("falls back to a generic message when the API gives no detail", async () => {
    mockFetchOnce({ ok: false, json: () => Promise.resolve({}) });

    const result = await verifyEmailToken("bad-token");

    expect(result).toEqual({ ok: false, message: "Verification failed." });
  });

  it("reports a network error when fetch throws", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));

    const result = await verifyEmailToken("any-token");

    expect(result).toEqual({
      ok: false,
      message: "Network error. Please try again.",
    });
  });

  it("posts the token to the BFF verify endpoint", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue({ ok: true, json: () => Promise.resolve({}) });
    vi.stubGlobal("fetch", fetchMock);

    await verifyEmailToken("tok-123");

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/auth/verify-email",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ token: "tok-123" }),
      }),
    );
  });
});
