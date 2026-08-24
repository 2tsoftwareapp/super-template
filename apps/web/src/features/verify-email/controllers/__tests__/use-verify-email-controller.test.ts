import { act, renderHook } from "@testing-library/react";
import { useRouter, useSearchParams } from "next/navigation";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { verifyEmail } from "../../api/verify-email.api";
import {
  VERIFY_EMAIL_ADMIN_URL,
  VERIFY_EMAIL_MESSAGES,
  VERIFY_EMAIL_REDIRECT_DELAY_MS,
} from "../../config/verify-email-config";
import { useVerifyEmailController } from "../use-verify-email-controller";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({ push: vi.fn() })),
  useSearchParams: vi.fn(() => new URLSearchParams()),
}));

vi.mock("../../api/verify-email.api", () => ({
  verifyEmail: vi.fn(),
}));

const verifyEmailMock = vi.mocked(verifyEmail);
const routerPushMock = vi.fn();

const asRouter = (push: ReturnType<typeof vi.fn>) =>
  ({ push }) as unknown as ReturnType<typeof useRouter>;

const asSearchParams = (searchParams: URLSearchParams) =>
  searchParams as unknown as ReturnType<typeof useSearchParams>;

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(useRouter).mockReturnValue(asRouter(routerPushMock));
  vi.mocked(useSearchParams).mockReturnValue(asSearchParams(new URLSearchParams()));
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("useVerifyEmailController", () => {
  it("shows the error state without calling the API when the token is missing", () => {
    vi.mocked(useSearchParams).mockReturnValue(asSearchParams(new URLSearchParams()));

    const { result } = renderHook(() => useVerifyEmailController());

    expect(result.current).toEqual({
      status: "error",
      message: VERIFY_EMAIL_MESSAGES.missingToken,
    });
    expect(verifyEmailMock).not.toHaveBeenCalled();
  });

  it("verifies the token and reports success", async () => {
    vi.mocked(useSearchParams).mockReturnValue(
      asSearchParams(new URLSearchParams("token=tok-123")),
    );
    verifyEmailMock.mockResolvedValueOnce(undefined);

    const { result } = renderHook(() => useVerifyEmailController());

    expect(result.current.status).toBe("verifying");
    expect(verifyEmailMock).toHaveBeenCalledWith("tok-123");

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(result.current).toEqual({
      status: "success",
      message: VERIFY_EMAIL_MESSAGES.success,
    });
  });

  it("redirects to the admin app after the configured delay", async () => {
    vi.mocked(useSearchParams).mockReturnValue(
      asSearchParams(new URLSearchParams("token=tok-123")),
    );
    verifyEmailMock.mockResolvedValueOnce(undefined);

    const { result } = renderHook(() => useVerifyEmailController());

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(result.current.status).toBe("success");
    expect(routerPushMock).not.toHaveBeenCalled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(VERIFY_EMAIL_REDIRECT_DELAY_MS);
    });

    expect(routerPushMock).toHaveBeenCalledWith(VERIFY_EMAIL_ADMIN_URL);
  });

  it("cancels the scheduled redirect when the screen unmounts", async () => {
    vi.mocked(useSearchParams).mockReturnValue(
      asSearchParams(new URLSearchParams("token=tok-123")),
    );
    verifyEmailMock.mockResolvedValueOnce(undefined);

    const { unmount } = renderHook(() => useVerifyEmailController());

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    unmount();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(VERIFY_EMAIL_REDIRECT_DELAY_MS);
    });

    expect(routerPushMock).not.toHaveBeenCalled();
  });

  it("surfaces a safe error message on API failure", async () => {
    vi.mocked(useSearchParams).mockReturnValue(
      asSearchParams(new URLSearchParams("token=tok-123")),
    );
    verifyEmailMock.mockRejectedValueOnce(new Error("boom"));

    const { result } = renderHook(() => useVerifyEmailController());

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(result.current.status).toBe("error");
    expect(result.current.message).toBe(VERIFY_EMAIL_MESSAGES.fallbackError);
  });
});
