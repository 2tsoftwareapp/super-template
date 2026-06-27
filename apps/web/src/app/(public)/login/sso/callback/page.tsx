import { Suspense } from "react";

import { AuthShell } from "@/components/auth/auth-shell";
import { Skeleton } from "@/components/ui/skeleton";

import { SsoCallbackView } from "./sso-callback-view";

function SsoCallbackFallback() {
  return (
    <AuthShell
      eyebrow="SSO callback"
      title="Completing sign-in"
      body="Processing your authentication. Please wait a moment..."
    >
      <Skeleton className="h-10 w-full" aria-hidden="true" />
    </AuthShell>
  );
}

export default function SsoCallbackPage() {
  return (
    <Suspense fallback={<SsoCallbackFallback />}>
      <SsoCallbackView />
    </Suspense>
  );
}
