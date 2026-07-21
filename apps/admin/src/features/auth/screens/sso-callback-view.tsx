"use client";

import { useAdminSsoCallbackFlow } from "@/features/auth/controllers/use-admin-sso-callback-flow";

/**
 * SSO callback screen: shows progress while the handler exchanges the code.
 */
export function SsoCallbackView() {
  const { statusMessage } = useAdminSsoCallbackFlow();

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-sm text-muted-foreground">{statusMessage}</p>
    </div>
  );
}
