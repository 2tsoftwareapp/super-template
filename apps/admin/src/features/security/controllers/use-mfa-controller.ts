"use client";

import { getErrorMessage } from "@repo/web-utils/errors";
import { useState } from "react";
import { toast } from "sonner";

import type {
  MfaSecurityViewModel,
  MfaSetupResponse,
  MfaView,
} from "@/features/security/model/security.types";

import {
  useConfirmMfaMutation,
  useDisableMfaMutation,
  useRegenerateMfaCodesMutation,
  useSetupMfaMutation,
} from "@/features/security/api/security.mutations";
import { useMfaStatusQuery } from "@/features/security/api/security.queries";

/**
 * MFA management orchestration.
 *
 * Flow:
 *   1. Read uncached MFA status for the current identity.
 *   2. Start setup and retain the one-time secret only in component memory.
 *   3. Confirm, disable, or regenerate through mutation hooks with safe errors.
 *   4. Clear setup secrets and recovery codes when each sensitive flow ends.
 * Trace: CODING_RULES §18 error handling, §19 sensitive cache, §20 security.
 */
export function useMfaController(): MfaSecurityViewModel {
  // Step 1: sensitive setup state is memory-only and scoped to this screen.
  const [view, setView] = useState<MfaView>("idle");
  const [setupData, setSetupData] = useState<MfaSetupResponse["data"] | null>(
    null,
  );
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [otpCode, setOtpCode] = useState("");

  const status = useMfaStatusQuery();

  const mfaEnabled = status.data?.data.enabled ?? false;

  // Step 2: API hooks own transport/cache; this controller owns flow state.
  const setupMutation = useSetupMfaMutation();
  const confirmMutation = useConfirmMfaMutation();
  const disableMutation = useDisableMfaMutation();
  const regenerateMutation = useRegenerateMfaCodesMutation();

  function clearSensitiveFlowState() {
    setSetupData(null);
    setRecoveryCodes([]);
    setOtpCode("");
  }

  // Step 3: user actions surface sanitized errors and never leave stale codes.
  async function handleStartSetup() {
    clearSensitiveFlowState();
    try {
      const data = await setupMutation.mutateAsync();
      setSetupData(data.data);
      setView("setup");
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not start MFA setup."));
    }
  }

  async function handleVerifyOtp(code: string) {
    try {
      const data = await confirmMutation.mutateAsync(code);
      setRecoveryCodes(data.data.recoveryCodes);
      setView("recovery-codes");
      setSetupData(null);
      setOtpCode("");
    } catch (error) {
      setOtpCode("");
      toast.error(getErrorMessage(error, "Could not verify the MFA code."));
    }
  }

  async function handleDisable(code: string) {
    try {
      await disableMutation.mutateAsync(code);
      setOtpCode("");
    } catch (error) {
      setOtpCode("");
      toast.error(getErrorMessage(error, "Could not disable MFA."));
    }
  }

  async function handleRegenerate(code: string) {
    try {
      const data = await regenerateMutation.mutateAsync(code);
      setRecoveryCodes(data.data.recoveryCodes);
      setView("recovery-codes");
      setOtpCode("");
    } catch (error) {
      setOtpCode("");
      toast.error(
        getErrorMessage(error, "Could not regenerate recovery codes."),
      );
    }
  }

  function handleCancelSetup() {
    setView("idle");
    clearSensitiveFlowState();
  }

  function handleRecoveryCodesDone() {
    setView("idle");
    clearSensitiveFlowState();
  }

  // Step 4: screens receive rendering state and callbacks only.
  return {
    status: {
      isLoading: status.isLoading,
      isError: status.isError,
      mfaEnabled,
      handleRetry: () => {
        void status.refetch();
      },
    },
    view,
    setupData,
    recoveryCodes,
    otpCode,
    handleOtpChange: setOtpCode,
    handleStartSetup,
    handleVerifyOtp,
    handleDisable,
    handleRegenerate,
    handleCancelSetup,
    handleRecoveryCodesDone,
    handleCopyRecoveryCodes: () =>
      toast.success("Recovery codes copied to clipboard"),
    handleCopyRecoveryCodesError: () =>
      toast.error("Could not copy recovery codes"),
    isSettingUp: setupMutation.isPending,
    isVerifying: confirmMutation.isPending,
    isDisabling: disableMutation.isPending,
    isRegenerating: regenerateMutation.isPending,
  };
}
