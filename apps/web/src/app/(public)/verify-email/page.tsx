import { Suspense } from "react";

import { AuthShell } from "@/components/auth/auth-shell";
import { Skeleton } from "@/components/ui/skeleton";

import { VerifyEmailView } from "./verify-email-view";

function VerifyEmailFallback() {
  return (
    <AuthShell
      eyebrow="Email verification"
      title="Verify your email"
      body="Loading verification details…"
      footer={
        <Skeleton className="mx-auto h-4 w-40" aria-hidden="true" />
      }
    >
      <Skeleton className="h-10 w-full" aria-hidden="true" />
    </AuthShell>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<VerifyEmailFallback />}>
      <VerifyEmailView />
    </Suspense>
  );
}
