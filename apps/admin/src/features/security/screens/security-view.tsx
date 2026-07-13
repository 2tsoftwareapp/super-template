"use client";

import { Separator } from "@repo/web-ui/separator";

import { ChangePasswordForm } from "../ui/change-password-form";
import { MfaManagement } from "../ui/mfa-management";
import { UserPreferences } from "../ui/user-preferences";

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
