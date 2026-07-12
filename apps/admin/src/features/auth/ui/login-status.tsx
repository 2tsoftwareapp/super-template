"use client";

import { AUTH_MESSAGES } from "@/features/auth/model/auth-constants";

export function LoginStatus() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-sm text-muted-foreground">
        {AUTH_MESSAGES.checkingSession}
      </p>
    </div>
  );
}
