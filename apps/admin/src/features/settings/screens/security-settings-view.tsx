"use client";

import { ErrorState } from "@repo/web-ui/error-state";

import { useSecurityController } from "@/features/security/controllers/use-security-controller";
import { ChangePasswordForm } from "@/features/security/ui/change-password-form";
import { MfaManagement } from "@/features/security/ui/mfa-management";

export function SecuritySettingsView() {
  const { password, mfa } = useSecurityController();

  return (
    <div className="space-y-6">
      <ChangePasswordForm
        onChangePassword={password.handleChangePassword}
        isSaving={password.isSaving}
      />

      {mfa.status.isError ? (
        <ErrorState
          variant="inline"
          title="Could not load MFA status."
          description="Your MFA settings were not changed."
          action={{ label: "Retry", onClick: mfa.status.handleRetry }}
        />
      ) : (
        <MfaManagement
          status={mfa.status.isLoading ? "loading" : mfa.status.mfaEnabled ? "enabled" : "disabled"}
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
  );
}
