"use client";

import { AUTH_MESSAGES } from "@/features/auth/auth-constants";
import { useAdminSsoCallbackFlow } from "@/features/auth/use-admin-sso-callback-flow";

export function SsoCallbackView() {
  useAdminSsoCallbackFlow();

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-sm text-muted-foreground">
        {AUTH_MESSAGES.completingSignIn}
      </p>
    </div>
  );
}
