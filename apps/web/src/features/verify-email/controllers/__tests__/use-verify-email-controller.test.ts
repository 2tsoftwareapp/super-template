import { act, renderHook } from "@testing-library/react";
import { useRouter, useSearchParams } from "next/navigation";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { verifyEmail } from "../../api/verify-email.api";
import { useVerifyEmailController } from "../../controllers/use-verify-email-controller";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({ push: vi.fn() })),
  useSearchParams: vi.fn(() => new URLSearchParams()),
}));

vi.mock("../../api/verify-email.api", () => ({
  verifyEmail: vi.fn(),
}));

const verifyEmailMock = vi.mocked(verifyEmail);
const routerPushMock = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(useRouter).mockReturnValue({ push: routerPushMock });
  vi.mocked(useSearchParams).mockReturnValue(new URLSearchParams());
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("useVerifyEmailController", () => {
  it("shows the error state without calling the API when the token is missing", () => {
    vi.mocked(useSearchParams).mockReturnValue(new URLSearchParams());

    const { result } = renderHook(() => useVerifyEmailController());

    expect(result.current).toEqual({
      status: "error",
      message: "Missing verification token.",
    });
    expect(verifyEmailMock).not.toHaveBeenCalled();
  });

  it("verifies the token and reports success", async () => {
    vi.mocked(useSearchParams).mockReturnValue(new URLSearchParams("token=tok-123"));
    verifyEmailMock.mockResolvedValueOnce(undefined);

    const { result } = renderHook(() => useVerifyEmailController());

    expect(result.current.status).toBe("verifying");
    expect(verifyEmailMock).toHaveBeenCalledWith("tok-123");

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(result.current).toEqual({
      status: "success",
      message: "Email verified successfully! Your account is now active.",
    });
  });

  it("redirects to the admin app shortly after success", async () => {
    vi.mocked(useSearchParams).mockReturnValue(new URLSearchParams("token=tok-123"));
    verifyEmailMock.mockResolvedValueOnce(undefined);

    const { result } = renderHook(() => useVerifyEmailController());

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(result.current.status).toBe("success");
    expect(routerPushMock).not.toHaveBeenCalled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });

    expect(routerPushMock).toHaveBeenCalledWith(expect.stringContaining("http://localhost:3002"));
  });

  it("surfaces a safe error message on API failure", async () => {
    vi.mocked(useSearchParams).mockReturnValue(new URLSearchParams("token=tok-123"));
    verifyEmailMock.mockRejectedValueOnce(new Error("boom"));

    const { result } = renderHook(() => useVerifyEmailController());

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(result.current.status).toBe("error");
    expect(result.current.message).toBe("Verification failed.");
  });
});