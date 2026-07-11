"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { verifyEmailToken } from "../verify-email-service";

const ADMIN_URL = process.env.NEXT_PUBLIC_ADMIN_URL ?? "http://localhost:3002";

type VerifyStatus = "verifying" | "success" | "error";

export function VerifyEmailView() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  // No token → start (and stay) in the error state without any effect work.
  const [status, setStatus] = useState<VerifyStatus>(
    token ? "verifying" : "error",
  );
  const [message, setMessage] = useState(
    token ? "" : "Missing verification token.",
  );

  useEffect(() => {
    if (!token) return;

    let cancelled = false;
     
    void verifyEmailToken(token).then((result) => {
      if (cancelled) return;
      setStatus(result.ok ? "success" : "error");
      setMessage(result.message);
      if (result.ok) {
        setTimeout(() => router.push(ADMIN_URL), 3000);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [token, router]);

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="mx-auto max-w-md text-center">
        {status === "verifying" && (
          <>
            <Spinner />
            <p className="mt-4 text-muted-foreground">
              Verifying your email...
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-green-100 text-green-600">
              <CheckIcon />
            </div>
            <h1 className="text-xl font-semibold">Email verified!</h1>
            <p className="mt-2 text-muted-foreground">{message}</p>
            <p className="mt-4 text-sm text-muted-foreground">
              Redirecting to admin...
            </p>
          </>
        )}

        {status === "error" && (
          <>
            <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-red-100 text-red-600">
              <XIcon />
            </div>
            <h1 className="text-xl font-semibold">Verification failed</h1>
            <p className="mt-2 text-muted-foreground">{message}</p>
          </>
        )}
      </div>
    </main>
  );
}

function Spinner() {
  return (
    <div className="flex items-center justify-center">
      <div className="size-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
    </div>
  );
}

function CheckIcon() {
  return (
    <svg
      className="size-6"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg
      className="size-6"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  );
}
