"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";

function VerifyEmailInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");
  const [message, setMessage] = useState("");

  const verify = useCallback(async () => {
    if (!token) {
      setStatus("error");
      setMessage("Missing verification token.");
      return;
    }

    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus("success");
        setMessage("Email verified successfully! Your account is now active.");
        setTimeout(() => {
          router.push(process.env.NEXT_PUBLIC_ADMIN_URL ?? "/");
        }, 3000);
      } else {
        setStatus("error");
        setMessage(data?.error?.message ?? "Verification failed.");
      }
    } catch {
      setStatus("error");
      setMessage("Network error. Please try again.");
    }
  }, [token, router]);

  useEffect(() => {
    verify();
  }, [verify]);

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="mx-auto max-w-md text-center">
        {status === "verifying" && <Spinner />}
        {status === "verifying" && (
          <p className="mt-4 text-muted-foreground">Verifying your email...</p>
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
    <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailInner />
    </Suspense>
  );
}
