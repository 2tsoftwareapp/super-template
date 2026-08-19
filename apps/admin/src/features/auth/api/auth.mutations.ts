"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { SsoProvider } from "@/lib/api-paths";

import { sessionQueryKey } from "@/hooks/use-session";

import type { MfaChallengeInput } from "../model/auth.schemas";

import {
  establishAdminSsoSession,
  loginToAdmin,
  logoutAdmin,
  startSso,
  verifyAdminMfaChallenge,
} from "./auth.api";

/** Thin password-login mutation — handler interprets the payload. */
export function useLoginMutation() {
  return useMutation({
    mutationFn: loginToAdmin,
  });
}

/** Thin MFA mutation — handler asserts admin access. */
export function useMfaMutation(mfaToken: string | null) {
  return useMutation({
    mutationFn: (values: MfaChallengeInput) => verifyAdminMfaChallenge({ ...values, mfaToken }),
  });
}

/** Fetch IdP authorization URL (handler performs the browser redirect). */
export function useSsoStartMutation() {
  return useMutation({
    mutationFn: async ({ provider, redirectUri }: { provider: SsoProvider; redirectUri: string }) =>
      startSso(provider, redirectUri),
  });
}

/**
 * Establish session from SSO exchange code and refresh the session query.
 * Navigation stays in the SSO callback handler.
 */
export function useEstablishSsoSessionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: establishAdminSsoSession,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: sessionQueryKey });
    },
  });
}

/**
 * Logout and wipe the query cache so the next identity cannot see prior data.
 * Trace: CODING_RULES §19 R6 / §20 R10.
 * Navigation is owned by the caller (guard / login flow).
 */
export function useLogoutMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: logoutAdmin,
    onSettled: () => {
      queryClient.clear();
    },
  });
}
