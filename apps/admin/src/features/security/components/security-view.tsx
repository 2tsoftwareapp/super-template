"use client";

import { Separator } from "@repo/web-core/components/separator";

import { ChangePasswordForm } from "./change-password-form";
import { MfaManagement } from "./mfa-management";
import { UserPreferences } from "./user-preferences";

export function SecurityView() {
  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Account settings
        </h1>
        <p className="text-sm text-muted-foreground">
          Manage your password, security, and preferences.
        </p>
      </div>

      <UserPreferences />

      <Separator />

      <ChangePasswordForm />

      <Separator />

      <MfaManagement />
    </div>
  );
}
