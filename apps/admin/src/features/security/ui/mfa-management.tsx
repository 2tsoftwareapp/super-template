"use client";

import { Button } from "@repo/web-ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/web-ui/card";
import { Spinner } from "@repo/web-ui/spinner";
import { Shield } from "lucide-react";
import { useState } from "react";

import type { MfaSetupResponse } from "@/features/security/model/security.schemas";

import {
  useConfirmMfaMutation,
  useDisableMfaMutation,
  useRegenerateMfaCodesMutation,
  useSetupMfaMutation,
} from "@/features/security/api/security.mutations";
import { useMfaStatusQuery } from "@/features/security/api/security.queries";

import { MfaEnabledActions } from "./mfa-enabled-actions";
import { MfaRecoveryCodes } from "./mfa-recovery-codes";
import { MfaSetupFlow } from "./mfa-setup-flow";
import { MfaStatusBadge } from "./mfa-status-badge";

type MfaView = "idle" | "setup" | "recovery-codes";

export function MfaManagement() {
  const [view, setView] = useState<MfaView>("idle");
  const [setupData, setSetupData] = useState<MfaSetupResponse["data"] | null>(
    null,
  );
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [otpCode, setOtpCode] = useState("");

  const status = useMfaStatusQuery();

  const mfaEnabled = status.data?.data.enabled ?? false;

  const setupMutation = useSetupMfaMutation({
    onSuccess: (data) => {
      setSetupData(data.data);
      setView("setup");
      setOtpCode("");
    },
  });

  const confirmMutation = useConfirmMfaMutation({
    onSuccess: (data) => {
      setRecoveryCodes(data.data.recoveryCodes);
      setView("recovery-codes");
      setSetupData(null);
      setOtpCode("");
    },
    onError: () => {
      setOtpCode("");
    },
  });

  const disableMutation = useDisableMfaMutation({
    onSuccess: () => {
      setOtpCode("");
    },
    onError: () => {
      setOtpCode("");
    },
  });

  const regenerateMutation = useRegenerateMfaCodesMutation({
    onSuccess: (data) => {
      setRecoveryCodes(data.data.recoveryCodes);
      setView("recovery-codes");
      setOtpCode("");
    },
    onError: () => {
      setOtpCode("");
    },
  });

  if (status.isLoading) {
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
        onDone={() => {
          setView("idle");
          setRecoveryCodes([]);
        }}
      />
    );
  }

  if (view === "setup" && setupData) {
    return (
      <MfaSetupFlow
        setupData={setupData}
        otpCode={otpCode}
        onOtpChange={setOtpCode}
        onVerify={(code) => confirmMutation.mutate(code)}
        onCancel={() => {
          setView("idle");
          setSetupData(null);
          setOtpCode("");
        }}
        isVerifying={confirmMutation.isPending}
      />
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Shield className="size-5" />
              Two-factor authentication
            </CardTitle>
            <CardDescription>
              Add an extra layer of security to your account with a TOTP
              authenticator app.
            </CardDescription>
          </div>
          <MfaStatusBadge enabled={mfaEnabled} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {mfaEnabled ? (
          <MfaEnabledActions
            otpCode={otpCode}
            onOtpChange={setOtpCode}
            onDisable={(code) => disableMutation.mutate(code)}
            onRegenerate={(code) => regenerateMutation.mutate(code)}
            isDisabling={disableMutation.isPending}
            isRegenerating={regenerateMutation.isPending}
          />
        ) : (
          <Button onClick={() => setupMutation.mutate()}>
            {setupMutation.isPending && <Spinner className="mr-2 size-4" />}
            Enable two-factor authentication
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
