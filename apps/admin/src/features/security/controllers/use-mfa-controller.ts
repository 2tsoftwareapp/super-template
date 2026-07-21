"use client";

import { useState } from "react";
import { toast } from "sonner";

import type { MfaSetupResponse } from "@/features/security/model/security.schemas";

import {
  useConfirmMfaMutation,
  useDisableMfaMutation,
  useRegenerateMfaCodesMutation,
  useSetupMfaMutation,
} from "@/features/security/api/security.mutations";
import { useMfaStatusQuery } from "@/features/security/api/security.queries";

export type MfaView = "idle" | "setup" | "recovery-codes";

export function useMfaController() {
  const [view, setView] = useState<MfaView>("idle");
  const [setupData, setSetupData] = useState<MfaSetupResponse["data"] | null>(
    null,
  );
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [otpCode, setOtpCode] = useState("");

  const status = useMfaStatusQuery();

  const mfaEnabled = status.data?.data.enabled ?? false;

  const setupMutation = useSetupMfaMutation({
    onSuccess: (data) => {
      setSetupData(data.data);
      setView("setup");
      setOtpCode("");
    },
  });

  const confirmMutation = useConfirmMfaMutation({
    onSuccess: (data) => {
      setRecoveryCodes(data.data.recoveryCodes);
      setView("recovery-codes");
      setSetupData(null);
      setOtpCode("");
    },
    onError: () => {
      setOtpCode("");
    },
  });

  const disableMutation = useDisableMfaMutation({
    onSuccess: () => {
      setOtpCode("");
    },
    onError: () => {
      setOtpCode("");
    },
  });

  const regenerateMutation = useRegenerateMfaCodesMutation({
    onSuccess: (data) => {
      setRecoveryCodes(data.data.recoveryCodes);
      setView("recovery-codes");
      setOtpCode("");
    },
    onError: () => {
      setOtpCode("");
    },
  });

  return {
    status: {
      isLoading: status.isLoading,
      mfaEnabled,
    },
    view,
    setupData,
    recoveryCodes,
    otpCode,
    setOtpCode,
    onStartSetup: () => setupMutation.mutate(),
    onVerifyOtp: (code: string) => confirmMutation.mutate(code),
    onDisable: (code: string) => disableMutation.mutate(code),
    onRegenerate: (code: string) => regenerateMutation.mutate(code),
    onCancelSetup: () => {
      setView("idle");
      setSetupData(null);
      setOtpCode("");
    },
    onRecoveryCodesDone: () => {
      setView("idle");
      setRecoveryCodes([]);
    },
    onCopyRecoveryCodes: () => toast.success("Recovery codes copied to clipboard"),
    onCopyRecoveryCodesError: () => toast.error("Could not copy recovery codes"),
    isSettingUp: setupMutation.isPending,
    isVerifying: confirmMutation.isPending,
    isDisabling: disableMutation.isPending,
    isRegenerating: regenerateMutation.isPending,
  };
}
