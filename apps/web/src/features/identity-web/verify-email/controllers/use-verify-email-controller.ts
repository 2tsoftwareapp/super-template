"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import type { VerifyEmailStatus, VerifyEmailViewModel } from "../contracts/verify-email-view-model";

import { verifyEmail } from "../api/verify-email.api";
import {
  VERIFY_EMAIL_ADMIN_URL,
  VERIFY_EMAIL_MESSAGES,
  VERIFY_EMAIL_REDIRECT_DELAY_MS,
} from "../config/verify-email-config";
import { getVerifyEmailErrorMessage } from "./verify-email-error";
import { parseVerifyEmailSearchParams } from "./verify-email-search-params";

/**
 * Application orchestration for the verify-email screen.
 *
 * Flow:
 *   1. Parse the verification token from URL search params.
 *   2. If missing, stay in the error state without calling the API.
 *   3. POST the token through the feature integration boundary.
 *   4. On success, expose confirmation state and schedule navigation to Admin.
 *   5. On failure, map infrastructure errors to safe presentation copy.
 */
export function useVerifyEmailController(): VerifyEmailViewModel {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { token } = parseVerifyEmailSearchParams(searchParams);

  const [status, setStatus] = useState<VerifyEmailStatus>(token ? "verifying" : "error");
  const [message, setMessage] = useState(token ? "" : VERIFY_EMAIL_MESSAGES.missingToken);

  useEffect(() => {
    if (!token) return;

    let cancelled = false;
    let redirectTimer: ReturnType<typeof setTimeout> | undefined;

    void verifyEmail(token)
      .then(() => {
        if (cancelled) return;
        setStatus("success");
        setMessage(VERIFY_EMAIL_MESSAGES.success);

        const adminUrl = VERIFY_EMAIL_ADMIN_URL;

        if (adminUrl) {
          redirectTimer = setTimeout(() => router.push(adminUrl), VERIFY_EMAIL_REDIRECT_DELAY_MS);
        }
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setStatus("error");
        setMessage(getVerifyEmailErrorMessage(error));
      });

    return () => {
      cancelled = true;
      if (redirectTimer) clearTimeout(redirectTimer);
    };
  }, [token, router]);

  return { status, message };
}
