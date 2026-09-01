"use client";

import { Button } from "@repo/web-ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/web-ui/card";
import { Spinner } from "@repo/web-ui/spinner";
import { Shield, ShieldCheck } from "lucide-react";

import type { MfaSetupResponse } from "@/features/security/model/security.types";

import { MfaEnabledActions } from "./mfa-enabled-actions";
import { MfaRecoveryCodes } from "./mfa-recovery-codes";
import { MfaSetupFlow } from "./mfa-setup-flow";
import { MfaStatusBadge } from "./mfa-status-badge";

type MfaStatus = "loading" | "enabled" | "disabled";

interface MfaManagementProps {
  status: MfaStatus;
  view: "idle" | "setup" | "recovery-codes";
  setupData: MfaSetupResponse["data"] | null;
  recoveryCodes: string[];
  otpCode: string;
  onOtpChange: (code: string) => void;
  onStartSetup: () => void;
  onVerifyOtp: (code: string) => void;
  onDisable: (code: string) => void;
  onRegenerate: (code: string) => void;
  onCancelSetup: () => void;
  onRecoveryCodesDone: () => void;
  isSettingUp: boolean;
  isVerifying: boolean;
  isDisabling: boolean;
  isRegenerating: boolean;
  onCopyRecoveryCodes: () => void;
  onCopyRecoveryCodesError: () => void;
}

export function MfaManagement({
  status,
  view,
  setupData,
  recoveryCodes,
  otpCode,
  onOtpChange,
  onStartSetup,
  onVerifyOtp,
  onDisable,
  onRegenerate,
  onCancelSetup,
  onRecoveryCodesDone,
  isSettingUp,
  isVerifying,
  isDisabling,
  isRegenerating,
  onCopyRecoveryCodes,
  onCopyRecoveryCodesError,
}: MfaManagementProps) {
  if (status === "loading") {
    return (
      <Card>
        <CardContent className="flex justify-center py-12">
          <Spinner className="size-5" />
        </CardContent>
      </Card>
    );
  }

  if (view === "recovery-codes") {
    return (
      <MfaRecoveryCodes
        codes={recoveryCodes}
        onDone={onRecoveryCodesDone}
        onCopy={onCopyRecoveryCodes}
        onCopyError={onCopyRecoveryCodesError}
      />
    );
  }

  if (view === "setup" && setupData) {
    return (
      <MfaSetupFlow
        setupData={setupData}
        otpCode={otpCode}
        onOtpChange={onOtpChange}
        onVerify={onVerifyOtp}
        onCancel={onCancelSetup}
        isVerifying={isVerifying}
      />
    );
  }

  const mfaEnabled = status === "enabled";

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              {mfaEnabled ? (
                <ShieldCheck className="size-5 text-primary" />
              ) : (
                <Shield className="size-5 text-muted-foreground" />
              )}
              Two-factor authentication
            </CardTitle>
            <CardDescription>
              Add an extra layer of security to your admin account using time-based one-time
              passwords (TOTP).
            </CardDescription>
          </div>
          <MfaStatusBadge enabled={mfaEnabled} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {mfaEnabled ? (
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground">
              Two-factor authentication is active. You will be required to provide a 6-digit
              verification code upon signing in from unrecognized devices.
            </p>
            <MfaEnabledActions
              otpCode={otpCode}
              onOtpChange={onOtpChange}
              onDisable={onDisable}
              onRegenerate={onRegenerate}
              isDisabling={isDisabling}
              isRegenerating={isRegenerating}
            />
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              When two-factor authentication is enabled, you will need your authenticator app (such
              as Google Authenticator, 1Password, or Authy) to verify your sign-in attempts.
            </p>
            <Button onClick={onStartSetup} disabled={isSettingUp}>
              {isSettingUp && <Spinner className="mr-2 size-4" />}
              Enable two-factor authentication
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
