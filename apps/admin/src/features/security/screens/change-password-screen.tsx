"use client";

import { ChangePasswordForm } from "../ui/change-password-form";

export function ChangePasswordScreen() {
  return (
    <div className="mx-auto max-w-md space-y-8 py-12">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Change your password
        </h1>
        <p className="text-sm text-muted-foreground">
          You must update your password before continuing.
        </p>
      </div>

      <ChangePasswordForm />
    </div>
  );
}
