"use client";

import { classifyError, getErrorMessage } from "@repo/web-utils/errors";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { ApiClientError } from "@/lib/http";

import type { VerifyEmailStatus, VerifyEmailViewModel } from "../model/verify-email.types";

import { verifyEmail } from "../api/verify-email.api";
import { parseVerifyEmailSearchParams } from "../model/verify-email.search-params";

const ADMIN_URL = process.env.NEXT_PUBLIC_ADMIN_URL ?? "http://localhost:3002";

const VERIFY_SUCCESS_MESSAGE = "Email verified successfully! Your account is now active.";
const MISSING_TOKEN_MESSAGE = "Missing verification token.";

function getVerifyEmailErrorMessage(error: unknown): string {
  const classified = classifyError(error);

  if (classified.kind === "network") {
    return "Network error. Please try again.";
  }

  if (error instanceof ApiClientError) {
    return error.payload?.error.message ?? "Verification failed.";
  }

  return getErrorMessage(error, "Verification failed.");
}

/**
 * Flow:
 *   1. Parse the verification token from URL search params.
 *   2. If missing, stay in the error state without calling the API.
 *   3. POST the token to the BFF verify endpoint.
 *   4. On success, show confirmation and redirect to admin after a short delay.
 *   5. On failure, classify the error and surface safe copy.
 */
export function useVerifyEmailController(): VerifyEmailViewModel {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { token } = parseVerifyEmailSearchParams(searchParams);

  const [status, setStatus] = useState<VerifyEmailStatus>(token ? "verifying" : "error");
  const [message, setMessage] = useState(token ? "" : MISSING_TOKEN_MESSAGE);

  useEffect(() => {
    if (!token) return;

    let cancelled = false;

    void verifyEmail(token)
      .then(() => {
        if (cancelled) return;
        setStatus("success");
        setMessage(VERIFY_SUCCESS_MESSAGE);
        setTimeout(() => router.push(ADMIN_URL), 3000);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setStatus("error");
        setMessage(getVerifyEmailErrorMessage(error));
      });

    return () => {
      cancelled = true;
    };
  }, [token, router]);

  return { status, message };
}
