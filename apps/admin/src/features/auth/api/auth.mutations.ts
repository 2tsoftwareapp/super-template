"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { SsoProvider } from "@/lib/api-paths";

import { sessionQueryKey } from "@/hooks/use-session";
import { useRouter } from "@/i18n/navigation";

import type { MfaChallengeInput } from "../model/auth.schemas";

import {
  ADMIN_AUTH_ROUTES,
  AUTH_FLOW_RESULTS,
  AUTH_STORAGE_KEYS,
} from "../model/auth.constants";
import {
  loginToAdmin,
  logoutAdmin,
  startSso,
  verifyAdminMfaChallenge,
} from "./auth.api";

export function useLoginMutation() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: loginToAdmin,
    onSuccess: async (result) => {
      if (result.status === AUTH_FLOW_RESULTS.mfaRequired) {
        return;
      }

      await queryClient.invalidateQueries({ queryKey: sessionQueryKey });
      router.replace(ADMIN_AUTH_ROUTES.postLogin);
    },
    onError: () => undefined,
  });
}

export function useMfaMutation(mfaToken: string | null) {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (values: MfaChallengeInput) =>
      verifyAdminMfaChallenge({ ...values, mfaToken }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: sessionQueryKey });
      router.replace(ADMIN_AUTH_ROUTES.postLogin);
    },
  });
}

export function useSsoStartMutation() {
  return useMutation({
    mutationFn: async ({ provider, redirectUri }: { provider: SsoProvider; redirectUri: string }) => {
      const authorizationUrl = await startSso(provider, redirectUri);
      sessionStorage.setItem(AUTH_STORAGE_KEYS.ssoProvider, provider);
      window.location.href = authorizationUrl;
    },
  });
}

export function useLogoutMutation() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: logoutAdmin,
    onSettled: () => {
      queryClient.removeQueries({ queryKey: sessionQueryKey });
      router.replace(ADMIN_AUTH_ROUTES.login);
    },
  });
}
