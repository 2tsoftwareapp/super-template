"use client";

import { Separator } from "@/components/ui/separator";

import { ChangePasswordForm } from "./change-password-form";
import { MfaManagement } from "./mfa-management";

export default function SecurityPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight">Security</h2>
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
