"use client";

import { standardSchemaResolver as zodResolver } from "@hookform/resolvers/standard-schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import type { SsoProvider } from "@/lib/api-paths";

import { sessionQueryKey, useSession } from "@/hooks/use-session";
import { useRouter } from "@/i18n/navigation";
import { apiPaths } from "@/lib/api-paths";

import {
  loginToAdmin,
  startSso,
  verifyAdminMfaChallenge,
} from "../api/auth.api";
import {
  ADMIN_AUTH_ROUTES,
  ADMIN_LOGIN_DEFAULT_VALUES,
  AUTH_ERROR_QUERY_VALUES,
  AUTH_FLOW_RESULTS,
  AUTH_FORM_FIELD_NAMES,
  AUTH_SEARCH_PARAMS,
  AUTH_STORAGE_KEYS,
  LOGIN_CONTENT,
} from "../model/auth.constants";
import {
  type AdminLoginInput,
  adminLoginSchema,
  type MfaChallengeInput,
  mfaChallengeSchema,
} from "../model/auth.schemas";
import { getLoginErrorMessage, getMfaErrorMessage } from "./auth-login-errors";

export function useAdminLoginFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const session = useSession();

  // Step 1: keep MFA challenge state between the login and verify steps.
  const [mfaToken, setMfaToken] = useState<string | null>(null);

  // Step 2: redirect operators who already have an active admin session.
  useEffect(() => {
    if (session.isSuccess && session.data) {
      router.replace(ADMIN_AUTH_ROUTES.postLogin);
    }
  }, [router, session.data, session.isSuccess]);

  // Step 3: wire credential and MFA forms to the shared auth schemas.
  const loginForm = useForm<AdminLoginInput>({
    resolver: zodResolver(adminLoginSchema),
    defaultValues: ADMIN_LOGIN_DEFAULT_VALUES,
  });

  const mfaForm = useForm<MfaChallengeInput>({
    resolver: zodResolver(mfaChallengeSchema),
    defaultValues: { [AUTH_FORM_FIELD_NAMES.code]: "" },
  });

  // Step 4: refresh session state and navigate after auth succeeds.
  async function completeAuthenticatedSession() {
    await queryClient.invalidateQueries({ queryKey: sessionQueryKey });
    router.replace(ADMIN_AUTH_ROUTES.postLogin);
  }

  // Step 5: submit credentials through the auth service.
  const loginMutation = useMutation({
    mutationFn: loginToAdmin,
    onSuccess: async (result) => {
      // Step 5a: pause on the MFA screen when the API requests a challenge.
      if (result.status === AUTH_FLOW_RESULTS.mfaRequired) {
        setMfaToken(result.mfaToken);
        return;
      }

      // Step 5b: finish the flow when the service returns an authenticated session.
      await completeAuthenticatedSession();
    },
  });

  // Step 6: verify the MFA challenge, then complete the session.
  const mfaMutation = useMutation({
    mutationFn: (values: MfaChallengeInput) =>
      verifyAdminMfaChallenge({ ...values, mfaToken }),
    onSuccess: completeAuthenticatedSession,
    onError: (error) => {
      mfaForm.setError(AUTH_FORM_FIELD_NAMES.code, {
        message: getMfaErrorMessage(error),
      });
    },
  });

  // Step 7: start provider SSO and hand browser navigation to the returned URL.
  async function handleSsoStart(provider: SsoProvider) {
    sessionStorage.setItem(AUTH_STORAGE_KEYS.ssoProvider, provider);

    const redirectUri = `${window.location.origin}${ADMIN_AUTH_ROUTES.ssoCallback}`;

    try {
      window.location.href = await startSso(provider, redirectUri);
    } catch {
      window.location.href = apiPaths.auth.ssoStart(provider, redirectUri);
    }
  }

  function handleLoginSubmit(values: AdminLoginInput) {
    loginMutation.mutate(values);
  }

  function handleMfaSubmit(values: MfaChallengeInput) {
    mfaMutation.mutate(values);
  }

  // Step 8: let the operator back out of MFA and restart credential login.
  function resetMfaChallenge() {
    setMfaToken(null);
    mfaForm.reset();
    loginMutation.reset();
  }

  // Step 9: expose a view-model for the login screen components.
  return {
    handleLoginSubmit,
    handleMfaSubmit,
    handleSsoStart,
    isCheckingExistingSession: session.isLoading || session.isSuccess,
    isMfaChallenge: Boolean(mfaToken),
    loginErrorMessage: loginMutation.isError
      ? getLoginErrorMessage(loginMutation.error)
      : null,
    loginForm,
    loginMutation,
    mfaErrorMessage: mfaMutation.isError
      ? getMfaErrorMessage(mfaMutation.error)
      : null,
    mfaForm,
    mfaMutation,
    resetMfaChallenge,
    loginContent: LOGIN_CONTENT.login,
    mfaContent: LOGIN_CONTENT.mfa,
    ssoError:
      searchParams.get(AUTH_SEARCH_PARAMS.error) ===
      AUTH_ERROR_QUERY_VALUES.ssoFailed,
  };
}
