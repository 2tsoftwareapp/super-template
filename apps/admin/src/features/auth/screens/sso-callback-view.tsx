"use client";

import { useAdminSsoCallbackFlow } from "@/features/auth/controllers/use-admin-sso-callback-flow";
import { AUTH_MESSAGES } from "@/features/auth/model/auth-constants";

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
