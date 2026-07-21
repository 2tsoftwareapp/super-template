"use client";

import type { SecurityViewModel } from "../model/security.types";

import { useChangePasswordController } from "./use-change-password-controller";
import { useMfaController } from "./use-mfa-controller";

/**
 * Account security root controller.
 *
 * Flow:
 *   1. Compose password orchestration, including cache clearing and redirect.
 *   2. Compose MFA status and one-time setup/recovery-code state.
 *   3. Return a single view model so the screen only wires presentational UI.
 * Trace: CODING_RULES §4 screen and §5 handler boundaries.
 */
export function useSecurityController(): SecurityViewModel {
  // Step 1: password lifecycle remains independently reusable by forced-change screens.
  const password = useChangePasswordController();
  // Step 2: MFA owns all sensitive setup state and mutation error handling.
  const mfa = useMfaController();

  // Step 3: expose no query or mutation objects to the screen.
  return { password, mfa };
}
