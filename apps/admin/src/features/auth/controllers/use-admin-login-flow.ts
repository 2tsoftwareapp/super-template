"use client";

import { standardSchemaResolver as zodResolver } from "@hookform/resolvers/standard-schema";
import { useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import type { SsoProvider } from "@/lib/api-paths";

import { sessionQueryKey, useSession } from "@/hooks/use-session";
import { useRouter } from "@/i18n/navigation";

import {
  useLoginMutation,
  useLogoutMutation,
  useMfaMutation,
  useSsoStartMutation,
} from "../api/auth.mutations";
import {
  ADMIN_AUTH_ROUTES,
  ADMIN_LOGIN_DEFAULT_VALUES,
  AUTH_ERROR_QUERY_VALUES,
  AUTH_FLOW_ERROR_CODES,
  AUTH_FLOW_RESULTS,
  AUTH_FORM_FIELD_NAMES,
  AUTH_MESSAGES,
  LOGIN_CONTENT,
  LOGIN_FORM_COPY,
  SSO_PROVIDER_OPTIONS,
} from "../model/auth.constants";
import { AuthFlowError } from "../model/auth.errors";
import {
  assertAdminLoginAccess,
  resolveAdminLoginResult,
} from "../model/auth.login-flow";
import {
  type AdminLoginInput,
  adminLoginSchema,
  type MfaChallengeInput,
  mfaChallengeSchema,
} from "../model/auth.schemas";
import { parseAuthLoginSearchParams } from "../model/auth.search-params";
import { getLoginErrorMessage, getMfaErrorMessage } from "./auth-login-errors";

/**
 * Login + MFA + SSO-start orchestration for the admin login screen.
 *
 * Flow:
 *   1. Redirect away when a session already exists.
 *   2. Password submit → interpret result (MFA / access / navigate).
 *   3. MFA submit → assert access, invalidate session, enter the app.
 *   4. SSO start → hand the browser to the IdP authorization URL.
 * Trace: CODING_RULES §5 handler / §18 error mapping.
 */
export function useAdminLoginFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const session = useSession();
  const queryClient = useQueryClient();

  const [mfaToken, setMfaToken] = useState<string | null>(null);
  const [flowError, setFlowError] = useState<unknown>(null);
  const loginSearch = parseAuthLoginSearchParams(searchParams);

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
  const logoutMutation = useLogoutMutation();
  const mfaMutation = useMfaMutation(mfaToken);
  const ssoStartMutation = useSsoStartMutation();

  async function denyNonAdmin(error: unknown) {
    if (
      error instanceof AuthFlowError &&
      error.code === AUTH_FLOW_ERROR_CODES.notAdmin
    ) {
      await logoutMutation.mutateAsync();
    }
  }

  function handleSsoStart(provider: SsoProvider) {
    setFlowError(null);
    const redirectUri = `${window.location.origin}${ADMIN_AUTH_ROUTES.ssoCallback}`;
    ssoStartMutation.mutate(
      { provider, redirectUri },
      {
        onSuccess: (authorizationUrl) => {
          window.location.href = authorizationUrl;
        },
      },
    );
  }

  function handleLoginSubmit(values: AdminLoginInput) {
    setFlowError(null);
    loginMutation.mutate(values, {
      onSuccess: (response) => {
        void (async () => {
          try {
            // Step 2: interpret BFF payload in the handler (not api/mutations)
            const result = resolveAdminLoginResult(response);

            if (result.status === AUTH_FLOW_RESULTS.mfaRequired) {
              setMfaToken(result.mfaToken);
              return;
            }

            await queryClient.invalidateQueries({ queryKey: sessionQueryKey });

            if (result.status === AUTH_FLOW_RESULTS.mustChangePassword) {
              router.replace("/security");
              return;
            }

            router.replace(ADMIN_AUTH_ROUTES.postLogin);
          } catch (error) {
            setFlowError(error);
            await denyNonAdmin(error);
          }
        })();
      },
    });
  }

  function handleMfaSubmit(values: MfaChallengeInput) {
    setFlowError(null);
    mfaMutation.mutate(values, {
      onSuccess: (response) => {
        void (async () => {
          try {
            assertAdminLoginAccess(response);
            await queryClient.invalidateQueries({ queryKey: sessionQueryKey });
            router.replace(ADMIN_AUTH_ROUTES.postLogin);
          } catch (error) {
            setFlowError(error);
            await denyNonAdmin(error);
          }
        })();
      },
    });
  }

  function resetMfaChallenge() {
    setMfaToken(null);
    setFlowError(null);
    mfaForm.reset();
    loginMutation.reset();
    mfaMutation.reset();
  }

  const loginErrorMessage = flowError
    ? getLoginErrorMessage(flowError)
    : loginMutation.isError
      ? getLoginErrorMessage(loginMutation.error)
      : null;

  const mfaErrorMessage = flowError
    ? getMfaErrorMessage(flowError)
    : mfaMutation.isError
      ? getMfaErrorMessage(mfaMutation.error)
      : null;

  return {
    handleLoginSubmit,
    handleMfaSubmit,
    handleSsoStart,
    isCheckingExistingSession: session.isLoading || session.isSuccess,
    isMfaChallenge: Boolean(mfaToken),
    loginErrorMessage,
    loginForm,
    isLoginPending: loginMutation.isPending || logoutMutation.isPending,
    mfaErrorMessage,
    mfaForm,
    isMfaPending: mfaMutation.isPending || logoutMutation.isPending,
    resetMfaChallenge,
    loginContent: LOGIN_CONTENT.login,
    mfaContent: LOGIN_CONTENT.mfa,
    formCopy: LOGIN_FORM_COPY,
    ssoProviders: SSO_PROVIDER_OPTIONS,
    checkingSessionMessage: AUTH_MESSAGES.checkingSession,
    ssoFailedMessage: AUTH_MESSAGES.ssoFailed,
    ssoError:
      ssoStartMutation.isError ||
      loginSearch.error === AUTH_ERROR_QUERY_VALUES.ssoFailed,
  };
}
