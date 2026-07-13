"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

import { sessionQueryKey } from "@/hooks/use-session";
import { useRouter } from "@/i18n/navigation";

import { establishAdminSsoSession } from "../api/auth.api";
import {
  ADMIN_AUTH_ROUTES,
  AUTH_ERROR_QUERY_VALUES,
  AUTH_SEARCH_PARAMS,
  AUTH_STORAGE_KEYS,
} from "../model/auth.constants";

const ssoFailedLoginPath = `${ADMIN_AUTH_ROUTES.login}?${AUTH_SEARCH_PARAMS.error}=${AUTH_ERROR_QUERY_VALUES.ssoFailed}`;

export function useAdminSsoCallbackFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const called = useRef(false);

  useEffect(() => {
    // Step 1: run the callback handler once, even under React Strict Mode.
    if (called.current) return;
    called.current = true;

    // Step 2: short-circuit when the provider already reported failure.
    if (
      searchParams.get(AUTH_SEARCH_PARAMS.error) ===
      AUTH_ERROR_QUERY_VALUES.ssoFailed
    ) {
      router.replace(ssoFailedLoginPath);
      return;
    }

    async function handleCallback() {
      // Step 3: require the exchange code returned by the SSO callback URL.
      const exchangeCode = searchParams.get(AUTH_SEARCH_PARAMS.exchange);
      if (!exchangeCode) {
        router.replace(ssoFailedLoginPath);
        return;
      }

      try {
        // Step 4: establish the admin session through the auth BFF.
        await establishAdminSsoSession(exchangeCode);

        // Step 5: clear transient SSO state and refresh the client session cache.
        sessionStorage.removeItem(AUTH_STORAGE_KEYS.ssoProvider);
        await queryClient.invalidateQueries({ queryKey: sessionQueryKey });

        // Step 6: send the operator into the admin console.
        router.replace(ADMIN_AUTH_ROUTES.postLogin);
      } catch {
        sessionStorage.removeItem(AUTH_STORAGE_KEYS.ssoProvider);
        router.replace(ssoFailedLoginPath);
      }
    }

    void handleCallback();
  }, [searchParams, router, queryClient]);
}
