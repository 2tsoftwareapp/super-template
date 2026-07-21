import { getErrorMessage } from "@repo/web-utils/errors";

import { webFetch } from "@/lib/http";

export interface VerifyEmailResult {
  ok: boolean;
  message: string;
}

export async function verifyEmailToken(
  token: string,
): Promise<VerifyEmailResult> {
  try {
    await webFetch("/api/auth/verify-email", {
      method: "POST",
      body: JSON.stringify({ token }),
    });

    return {
      ok: true,
      message: "Email verified successfully! Your account is now active.",
    };
  } catch (error) {
    if (error instanceof TypeError) {
      return { ok: false, message: "Network error. Please try again." };
    }

    return {
      ok: false,
      message: getErrorMessage(error, "Verification failed."),
    };
  }
}
