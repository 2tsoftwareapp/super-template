"use client";

import { Separator } from "@repo/web-ui/separator";
import { toast } from "sonner";

import { useChangePasswordMutation } from "@/features/security/api/security.mutations";
import { useMfaController } from "@/features/security/controllers/use-mfa-controller";

import { ChangePasswordForm } from "../ui/change-password-form";
import { MfaManagement } from "../ui/mfa-management";
import { UserPreferences } from "../ui/user-preferences";

export function SecurityView() {
  const changePassword = useChangePasswordMutation();
  const mfa = useMfaController();

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

      <ChangePasswordForm
        onChangePassword={(values) => changePassword.mutate(values)}
        isSaving={changePassword.isPending}
      />

      <Separator />

      <MfaManagement
        status={mfa.status.isLoading ? "loading" : mfa.status.mfaEnabled ? "enabled" : "disabled"}
        view={mfa.view}
        setupData={mfa.setupData}
        recoveryCodes={mfa.recoveryCodes}
        otpCode={mfa.otpCode}
        onOtpChange={mfa.setOtpCode}
        onStartSetup={mfa.onStartSetup}
        onVerifyOtp={mfa.onVerifyOtp}
        onDisable={mfa.onDisable}
        onRegenerate={mfa.onRegenerate}
        onCancelSetup={mfa.onCancelSetup}
        onRecoveryCodesDone={mfa.onRecoveryCodesDone}
        isSettingUp={mfa.isSettingUp}
        isVerifying={mfa.isVerifying}
        isDisabling={mfa.isDisabling}
        isRegenerating={mfa.isRegenerating}
        onCopyRecoveryCodes={() => toast.success("Recovery codes copied to clipboard")}
        onCopyRecoveryCodesError={() => toast.error("Could not copy recovery codes")}
      />
    </div>
  );
}
