export interface VerifyEmailResult {
  ok: boolean;
  message: string;
}

export async function verifyEmailToken(
  token: string,
): Promise<VerifyEmailResult> {
  try {
    const res = await fetch("/api/auth/verify-email", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token }),
    });
    const data = (await res.json()) as {
      error?: { message?: string } | null;
    };

    if (res.ok) {
      return {
        ok: true,
        message: "Email verified successfully! Your account is now active.",
      };
    }

    return {
      ok: false,
      message: data.error?.message ?? "Verification failed.",
    };
  } catch {
    return { ok: false, message: "Network error. Please try again." };
  }
}
