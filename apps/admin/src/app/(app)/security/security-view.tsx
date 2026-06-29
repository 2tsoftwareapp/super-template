"use client";

import { Separator } from "@/components/ui/separator";

import { ChangePasswordForm } from "./change-password-form";
import { MfaManagement } from "./mfa-management";

export function SecurityView() {
  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Account security
        </h1>
        <p className="text-sm text-muted-foreground">
          Manage your password and two-factor authentication settings.
        </p>
      </div>

      <ChangePasswordForm />

      <Separator />

      <MfaManagement />
    </div>
  );
}
