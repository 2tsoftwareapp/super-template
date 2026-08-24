import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApiClientError } from "@/core/http";
import * as http from "@/core/http";

import { verifyEmail } from "../verify-email.api";

vi.mock("@/core/http", async () => {
  const actual = await vi.importActual<typeof http>("@/core/http");
  return {
    ...actual,
    webFetch: vi.fn(),
  };
});

const webFetchMock = vi.mocked(http.webFetch);

beforeEach(() => {
  webFetchMock.mockReset();
});

describe("verifyEmail", () => {
  it("resolves when the API accepts the token", async () => {
    webFetchMock.mockResolvedValueOnce({ data: {} });

    await expect(verifyEmail("valid-token")).resolves.toBeUndefined();
  });

  it("rethrows API client errors", async () => {
    const error = new ApiClientError(400, {
      error: { code: "BAD", message: "Token expired", details: null },
      meta: { requestId: "r1" },
    });
    webFetchMock.mockRejectedValueOnce(error);

    await expect(verifyEmail("expired-token")).rejects.toBe(error);
  });

  it("rethrows network failures", async () => {
    const error = new TypeError("Failed to fetch");
    webFetchMock.mockRejectedValueOnce(error);

    await expect(verifyEmail("any-token")).rejects.toBe(error);
  });

  it("posts the token to the BFF verify endpoint via webFetch", async () => {
    webFetchMock.mockResolvedValueOnce({ data: {} });

    await verifyEmail("tok-123");

    expect(webFetchMock).toHaveBeenCalledWith(
      "/api/auth/verify-email",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ token: "tok-123" }),
      }),
    );
  });
});
