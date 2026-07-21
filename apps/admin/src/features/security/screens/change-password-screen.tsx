"use client";

import { useChangePasswordMutation } from "@/features/security/api/security.mutations";

import { ChangePasswordForm } from "../ui/change-password-form";

export function ChangePasswordScreen() {
  const changePassword = useChangePasswordMutation();

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

      <ChangePasswordForm
        onChangePassword={(values) => changePassword.mutate(values)}
        isSaving={changePassword.isPending}
      />
    </div>
  );
}
