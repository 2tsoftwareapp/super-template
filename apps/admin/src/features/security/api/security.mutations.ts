"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { ChangePasswordFormValues } from "../model/security.schemas";

import { securityApi } from "./security.api";
import { securityKeys } from "./security.query-keys";

/** Starts an MFA enrollment and returns its one-time setup secret. */
export function useSetupMfaMutation() {
  return useMutation({
    mutationFn: securityApi.setupMfa,
  });
}

/** Confirms an MFA enrollment and refreshes the sensitive status query. */
export function useConfirmMfaMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: securityApi.confirmMfa,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: securityKeys.mfaStatus(),
      });
    },
  });
}

/** Disables MFA and refreshes the sensitive status query. */
export function useDisableMfaMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: securityApi.disableMfa,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: securityKeys.mfaStatus(),
      });
    },
  });
}

/** Regenerates the current user's one-time MFA recovery codes. */
export function useRegenerateMfaCodesMutation() {
  return useMutation({
    mutationFn: securityApi.regenerateMfaCodes,
  });
}

/** Changes the password and clears all identity-bound client cache. */
export function useChangePasswordMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: ChangePasswordFormValues) =>
      securityApi.changePassword({
        currentPassword: input.currentPassword,
        newPassword: input.newPassword,
      }),
    onSuccess: () => {
      // SECURITY: A password change invalidates the current identity context;
      // no cached tenant or user data may survive into the next login.
      queryClient.clear();
    },
  });
}
