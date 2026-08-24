import { webFetch } from "@/core/http/client";

/** POST the email-verification token to the web BFF. Errors propagate to the handler. */
export async function verifyEmail(token: string): Promise<void> {
  await webFetch("/api/auth/verify-email", {
    method: "POST",
    body: JSON.stringify({ token }),
  });
}
