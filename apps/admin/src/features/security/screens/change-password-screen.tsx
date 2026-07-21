"use client";

import { useChangePasswordController } from "@/features/security/controllers/use-change-password-controller";

import { ChangePasswordForm } from "../ui/change-password-form";

/** Connects the forced password-change controller to its form. */
export function ChangePasswordScreen() {
  const password = useChangePasswordController();

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
        onChangePassword={password.handleChangePassword}
        isSaving={password.isSaving}
      />
    </div>
  );
}
