"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type { MfaConfirmResponse, MfaSetupResponse } from "./model/security-schemas";

import { confirmMfa, disableMfa, regenerateMfaCodes, setupMfa } from "./api/security-api";
import { MFA_STATUS_KEY } from "./model/security-query-keys";

export function useSetupMfaMutation(options?: { onSuccess?: (data: MfaSetupResponse) => void }) {
  return useMutation({
    mutationFn: setupMfa,
    onSuccess: (data) => {
      options?.onSuccess?.(data);
    },
    onError: () => toast.error("Failed to start MFA setup"),
  });
}

export function useConfirmMfaMutation(options?: { onSuccess?: (data: MfaConfirmResponse) => void; onError?: () => void }) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: confirmMfa,
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: MFA_STATUS_KEY });
      toast.success("Two-factor authentication enabled");
      options?.onSuccess?.(data);
    },
    onError: () => {
      toast.error("Invalid code. Please try again.");
      options?.onError?.();
    },
  });
}

export function useDisableMfaMutation(options?: { onSuccess?: () => void; onError?: () => void }) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: disableMfa,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: MFA_STATUS_KEY });
      toast.success("Two-factor authentication disabled");
      options?.onSuccess?.();
    },
    onError: () => {
      toast.error("Invalid code. Please try again.");
      options?.onError?.();
    },
  });
}

export function useRegenerateMfaCodesMutation(options?: { onSuccess?: (data: MfaConfirmResponse) => void; onError?: () => void }) {
  return useMutation({
    mutationFn: regenerateMfaCodes,
    onSuccess: (data) => {
      toast.success("Recovery codes regenerated");
      options?.onSuccess?.(data);
    },
    onError: () => {
      toast.error("Invalid code. Please try again.");
      options?.onError?.();
    },
  });
}
