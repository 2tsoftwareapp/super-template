"use client";

import { standardSchemaResolver as zodResolver } from "@hookform/resolvers/standard-schema";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import type { SsoProvider } from "@/lib/api-paths";

import { useSession } from "@/hooks/use-session";
import { useRouter } from "@/i18n/navigation";

import {
  useLoginMutation,
  useMfaMutation,
  useSsoStartMutation,
} from "../api/auth.mutations";
import {
  ADMIN_AUTH_ROUTES,
  ADMIN_LOGIN_DEFAULT_VALUES,
  AUTH_ERROR_QUERY_VALUES,
  AUTH_FLOW_RESULTS,
  AUTH_FORM_FIELD_NAMES,
  AUTH_SEARCH_PARAMS,
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
  const session = useSession();

  const [mfaToken, setMfaToken] = useState<string | null>(null);

  useEffect(() => {
    if (session.isSuccess && session.data) {
      router.replace(ADMIN_AUTH_ROUTES.postLogin);
    }
  }, [router, session.data, session.isSuccess]);

  const loginForm = useForm<AdminLoginInput>({
    resolver: zodResolver(adminLoginSchema),
    defaultValues: ADMIN_LOGIN_DEFAULT_VALUES,
  });

  const mfaForm = useForm<MfaChallengeInput>({
    resolver: zodResolver(mfaChallengeSchema),
    defaultValues: { [AUTH_FORM_FIELD_NAMES.code]: "" },
  });

  const loginMutation = useLoginMutation();
  const mfaMutation = useMfaMutation(mfaToken);
  const ssoStartMutation = useSsoStartMutation();

  function handleSsoStart(provider: SsoProvider) {
    const redirectUri = `${window.location.origin}${ADMIN_AUTH_ROUTES.ssoCallback}`;
    ssoStartMutation.mutate({ provider, redirectUri });
  }

  function handleLoginSubmit(values: AdminLoginInput) {
    loginMutation.mutate(values, {
      onSuccess: (result) => {
        if (result?.status === AUTH_FLOW_RESULTS.mfaRequired) {
          setMfaToken(result.mfaToken);
        }
      },
    });
  }

  function handleMfaSubmit(values: MfaChallengeInput) {
    mfaMutation.mutate(values);
  }

  function resetMfaChallenge() {
    setMfaToken(null);
    mfaForm.reset();
    loginMutation.reset();
  }

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
    ssoError: loginMutation.isError
      ? true
      : searchParams.get(AUTH_SEARCH_PARAMS.error) ===
          AUTH_ERROR_QUERY_VALUES.ssoFailed,
  };
}
