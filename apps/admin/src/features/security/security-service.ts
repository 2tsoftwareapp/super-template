import { webFetch } from "@/lib/http";

import type { MfaConfirmResponse, MfaDisableResponse, MfaSetupResponse, MfaStatus } from "./security-schemas";

export async function changePassword(input: {
  currentPassword: string;
  newPassword: string;
}) {
  return webFetch("/api/users/me/password", {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function fetchMfaStatus() {
  return webFetch<MfaStatus>("/api/auth/mfa/status");
}

export async function setupMfa() {
  return webFetch<MfaSetupResponse>("/api/auth/mfa/setup", { method: "POST" });
}

export async function confirmMfa(code: string) {
  return webFetch<MfaConfirmResponse>("/api/auth/mfa/confirm", {
    method: "POST",
    body: JSON.stringify({ code }),
  });
}

export async function disableMfa(code: string) {
  return webFetch<MfaDisableResponse>("/api/auth/mfa/disable", {
    method: "POST",
    body: JSON.stringify({ code }),
  });
}

export async function regenerateMfaCodes(code: string) {
  return webFetch<MfaConfirmResponse>("/api/auth/mfa/recovery-codes/regenerate", {
    method: "POST",
    body: JSON.stringify({ code }),
  });
}
