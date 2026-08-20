"use client";

import { ErrorState } from "@repo/web-ui/error-state";
import { Separator } from "@repo/web-ui/separator";
import { Shield } from "lucide-react";

import type { AdminResourceConfig } from "@/lib/admin-resources";

import { ResourcePageShell } from "@/components/resource-page-shell";
import { useSecurityController } from "@/features/security/controllers/use-security-controller";

import { ChangePasswordForm } from "../ui/change-password-form";
import { MfaManagement } from "../ui/mfa-management";
import { UserPreferences } from "../ui/user-preferences";

const securityResource: AdminResourceConfig = {
  id: "security",
  label: "Account settings",
  group: "System",
  path: "/security",
  icon: Shield,
  features: ["list", "edit"],
  queryKey: "admin-security",
};

/** Connects the account-security controller to presentational sections. */
export function SecurityView() {
  const { password, mfa } = useSecurityController();

  return (
    <ResourcePageShell
      resource={securityResource}
      description="Manage your password, security, and preferences."
    >
      <div className="mx-auto max-w-2xl space-y-8">
        <UserPreferences />

        <Separator />

        <ChangePasswordForm
          onChangePassword={password.handleChangePassword}
          isSaving={password.isSaving}
        />

        <Separator />

        {mfa.status.isError ? (
          <ErrorState
            variant="inline"
            title="Could not load MFA status."
            description="Your MFA settings were not changed."
            action={{ label: "Retry", onClick: mfa.status.handleRetry }}
          />
        ) : (
          <MfaManagement
            status={
              mfa.status.isLoading ? "loading" : mfa.status.mfaEnabled ? "enabled" : "disabled"
            }
            view={mfa.view}
            setupData={mfa.setupData}
            recoveryCodes={mfa.recoveryCodes}
            otpCode={mfa.otpCode}
            onOtpChange={mfa.handleOtpChange}
            onStartSetup={mfa.handleStartSetup}
            onVerifyOtp={mfa.handleVerifyOtp}
            onDisable={mfa.handleDisable}
            onRegenerate={mfa.handleRegenerate}
            onCancelSetup={mfa.handleCancelSetup}
            onRecoveryCodesDone={mfa.handleRecoveryCodesDone}
            isSettingUp={mfa.isSettingUp}
            isVerifying={mfa.isVerifying}
            isDisabling={mfa.isDisabling}
            isRegenerating={mfa.isRegenerating}
            onCopyRecoveryCodes={mfa.handleCopyRecoveryCodes}
            onCopyRecoveryCodesError={mfa.handleCopyRecoveryCodesError}
          />
        )}
      </div>
    </ResourcePageShell>
  );
}
