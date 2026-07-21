"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { sessionQueryKey } from "@/hooks/use-session";
import { useRouter } from "@/i18n/navigation";

import type { ChangePasswordFormValues, MfaConfirmResponse, MfaSetupResponse } from "../model/security.schemas";

import { changePassword, confirmMfa, disableMfa, regenerateMfaCodes, setupMfa } from "./security.api";
import { securityKeys } from "./security.query-keys";

export function useSetupMfaMutation(options?: { onSuccess?: (data: MfaSetupResponse) => void }) {
  return useMutation({
    mutationFn: setupMfa,
    onSuccess: (data) => {
      options?.onSuccess?.(data);
    },
  });
}

export function useConfirmMfaMutation(options?: { onSuccess?: (data: MfaConfirmResponse) => void; onError?: () => void }) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: confirmMfa,
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: securityKeys.mfaStatus });
      options?.onSuccess?.(data);
    },
    onError: () => {
      options?.onError?.();
    },
  });
}

export function useDisableMfaMutation(options?: { onSuccess?: () => void; onError?: () => void }) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: disableMfa,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: securityKeys.mfaStatus });
      options?.onSuccess?.();
    },
    onError: () => {
      options?.onError?.();
    },
  });
}

export function useRegenerateMfaCodesMutation(options?: { onSuccess?: (data: MfaConfirmResponse) => void; onError?: () => void }) {
  return useMutation({
    mutationFn: regenerateMfaCodes,
    onSuccess: (data) => {
      options?.onSuccess?.(data);
    },
    onError: () => {
      options?.onError?.();
    },
  });
}

export function useChangePasswordMutation() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: ChangePasswordFormValues) =>
      changePassword({
        currentPassword: input.currentPassword,
        newPassword: input.newPassword,
      }),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: sessionQueryKey });
      router.replace("/login");
    },
  });
}
