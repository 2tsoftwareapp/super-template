import { webFetch } from "@/lib/http";

import type {
  ChangePasswordRequest,
  MfaDisableResponse,
  MfaRecoveryCodesResponse,
  MfaSetupResponse,
  MfaStatusResponse,
} from "../model/security.types";

// SECURITY: These are dedicated same-origin Next BFF routes that manage auth
// cookies and CSRF; they do not map to OpenAPI `/api/v1/*` paths for bffPath().
const SECURITY_BFF_PATHS = {
  password: "/api/users/me/password",
  mfa: {
    status: "/api/auth/mfa/status",
    setup: "/api/auth/mfa/setup",
    confirm: "/api/auth/mfa/confirm",
    disable: "/api/auth/mfa/disable",
    regenerateCodes: "/api/auth/mfa/recovery-codes/regenerate",
  },
} as const;

/** Same-origin BFF operations for account security. */
export const securityApi = {
  changePassword: (input: ChangePasswordRequest) => {
    return webFetch(SECURITY_BFF_PATHS.password, {
      method: "PATCH",
      body: JSON.stringify(input),
    });
  },

  fetchMfaStatus: () => {
    return webFetch<MfaStatusResponse>(SECURITY_BFF_PATHS.mfa.status);
  },

  setupMfa: () => {
    return webFetch<MfaSetupResponse>(SECURITY_BFF_PATHS.mfa.setup, {
      method: "POST",
    });
  },

  confirmMfa: (code: string) => {
    return webFetch<MfaRecoveryCodesResponse>(SECURITY_BFF_PATHS.mfa.confirm, {
      method: "POST",
      body: JSON.stringify({ code }),
    });
  },

  disableMfa: (code: string) => {
    return webFetch<MfaDisableResponse>(SECURITY_BFF_PATHS.mfa.disable, {
      method: "POST",
      body: JSON.stringify({ code }),
    });
  },

  regenerateMfaCodes: (code: string) => {
    return webFetch<MfaRecoveryCodesResponse>(
      SECURITY_BFF_PATHS.mfa.regenerateCodes,
      {
        method: "POST",
        body: JSON.stringify({ code }),
      },
    );
  },
};
