"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  Copy,
  KeyRound,
  RefreshCw,
  Shield,
  ShieldOff,
} from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";

import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { webFetch } from "@/lib/http";

interface MfaStatus {
  data: { enabled: boolean };
}

interface MfaSetupResponse {
  data: { secret: string; otpauthUrl: string };
}

interface MfaConfirmResponse {
  data: { recoveryCodes: string[] };
}

interface MfaDisableResponse {
  data: { success: boolean };
}

const MFA_STATUS_KEY = ["mfa-status"] as const;

type MfaView = "idle" | "setup" | "recovery-codes";

export function MfaManagement() {
  const queryClient = useQueryClient();
  const [view, setView] = useState<MfaView>("idle");
  const [setupData, setSetupData] = useState<MfaSetupResponse["data"] | null>(
    null,
  );
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [otpCode, setOtpCode] = useState("");

  const status = useQuery<MfaStatus>({
    queryKey: MFA_STATUS_KEY,
    queryFn: () => webFetch<MfaStatus>("/api/auth/mfa/status"),
  });

  const mfaEnabled = status.data?.data.enabled ?? false;

  const setupMutation = useMutation({
    mutationFn: () =>
      webFetch<MfaSetupResponse>("/api/auth/mfa/setup", { method: "POST" }),
    onSuccess: (data) => {
      setSetupData(data.data);
      setView("setup");
      setOtpCode("");
    },
    onError: () => toast.error("Failed to start MFA setup"),
  });

  const confirmMutation = useMutation({
    mutationFn: (code: string) =>
      webFetch<MfaConfirmResponse>("/api/auth/mfa/confirm", {
        method: "POST",
        body: JSON.stringify({ code }),
      }),
    onSuccess: (data) => {
      setRecoveryCodes(data.data.recoveryCodes);
      setView("recovery-codes");
      setSetupData(null);
      setOtpCode("");
      void queryClient.invalidateQueries({ queryKey: MFA_STATUS_KEY });
      toast.success("Two-factor authentication enabled");
    },
    onError: () => {
      toast.error("Invalid code. Please try again.");
      setOtpCode("");
    },
  });

  const disableMutation = useMutation({
    mutationFn: (code: string) =>
      webFetch<MfaDisableResponse>("/api/auth/mfa/disable", {
        method: "POST",
        body: JSON.stringify({ code }),
    }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: MFA_STATUS_KEY });
      setOtpCode("");
      toast.success("Two-factor authentication disabled");
    },
    onError: () => {
      toast.error("Invalid code. Please try again.");
      setOtpCode("");
    },
  });

  const regenerateMutation = useMutation({
    mutationFn: (code: string) =>
      webFetch<MfaConfirmResponse>("/api/auth/mfa/recovery-codes/regenerate", {
        method: "POST",
        body: JSON.stringify({ code }),
      }),
    onSuccess: (data) => {
      setRecoveryCodes(data.data.recoveryCodes);
      setView("recovery-codes");
      setOtpCode("");
      toast.success("Recovery codes regenerated");
    },
    onError: () => {
      toast.error("Invalid code. Please try again.");
      setOtpCode("");
    },
  });

  const copyRecoveryCodes = useCallback(() => {
    void navigator.clipboard
      .writeText(recoveryCodes.join("\n"))
      .then(() => toast.success("Recovery codes copied to clipboard"))
      .catch(() => toast.error("Could not copy recovery codes"));
  }, [recoveryCodes]);

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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <KeyRound className="size-5" />
            Recovery codes
          </CardTitle>
          <CardDescription>
            Save these codes in a safe place. Each code can only be used once to
            sign in if you lose access to your authenticator.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="warning">
            Store these codes securely. They will not be shown again.
          </Alert>
          <div className="grid grid-cols-2 gap-2 rounded-lg border border-border bg-muted/50 p-4 font-mono text-sm">
            {recoveryCodes.map((code) => (
              <span key={code} className="select-all">
                {code}
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={copyRecoveryCodes}>
              <Copy className="mr-2 size-3.5" />
              Copy codes
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setView("idle");
                setRecoveryCodes([]);
              }}
            >
              Done
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (view === "setup" && setupData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Shield className="size-5" />
            Set up two-factor authentication
          </CardTitle>
          <CardDescription>
            Scan the QR code with your authenticator app, then enter the
            verification code below.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col items-center gap-4">
            <div className="rounded-lg border border-border bg-white p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(setupData.otpauthUrl)}`}
                alt="QR Code for authenticator app"
                width={200}
                height={200}
              />
            </div>
            <div className="text-center">
              <p className="mb-1 text-xs text-muted-foreground">
                Or enter this key manually:
              </p>
              <code className="select-all rounded bg-muted px-2 py-1 font-mono text-xs">
                {setupData.secret}
              </code>
            </div>
          </div>

          <Separator />

          <div className="mx-auto max-w-xs space-y-3">
            <Label>Verification code</Label>
            <InputOTP
              maxLength={6}
              value={otpCode}
              onChange={setOtpCode}
              onComplete={(code: string) => confirmMutation.mutate(code)}
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
            <div className="flex gap-2">
              <Button
                className="flex-1"
                disabled={otpCode.length < 6 || confirmMutation.isPending}
                onClick={() => confirmMutation.mutate(otpCode)}
              >
                {confirmMutation.isPending && (
                  <Spinner className="mr-2 size-4" />
                )}
                Verify &amp; enable
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setView("idle");
                  setSetupData(null);
                  setOtpCode("");
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
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
          <Badge variant={mfaEnabled ? "default" : "outline"}>
            {mfaEnabled ? (
              <>
                <CheckCircle2 className="mr-1 size-3" />
                Enabled
              </>
            ) : (
              "Disabled"
            )}
          </Badge>
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

function MfaEnabledActions({
  otpCode,
  onOtpChange,
  onDisable,
  onRegenerate,
  isDisabling,
  isRegenerating,
}: {
  otpCode: string;
  onOtpChange: (val: string) => void;
  onDisable: (code: string) => void;
  onRegenerate: (code: string) => void;
  isDisabling: boolean;
  isRegenerating: boolean;
}) {
  const [action, setAction] = useState<"disable" | "regenerate" | null>(null);
  const isPending = isDisabling || isRegenerating;

  if (!action) {
    return (
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setAction("regenerate");
            onOtpChange("");
          }}
        >
          <RefreshCw className="mr-2 size-3.5" />
          Regenerate recovery codes
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setAction("disable");
            onOtpChange("");
          }}
        >
          <ShieldOff className="mr-2 size-3.5" />
          Disable
        </Button>
      </div>
    );
  }

  const handleSubmit = () => {
    if (action === "disable") onDisable(otpCode);
    else onRegenerate(otpCode);
  };

  return (
    <div className="max-w-xs space-y-3">
      <p className="text-sm text-muted-foreground">
        {action === "disable"
          ? "Enter a code from your authenticator app to disable MFA."
          : "Enter a code to regenerate your recovery codes."}
      </p>
      <Label>Verification code</Label>
      <InputOTP
        maxLength={6}
        value={otpCode}
        onChange={onOtpChange}
        onComplete={handleSubmit}
      >
        <InputOTPGroup>
          <InputOTPSlot index={0} />
          <InputOTPSlot index={1} />
          <InputOTPSlot index={2} />
          <InputOTPSlot index={3} />
          <InputOTPSlot index={4} />
          <InputOTPSlot index={5} />
        </InputOTPGroup>
      </InputOTP>
      <div className="flex gap-2">
        <Button
          className="flex-1"
          variant={action === "disable" ? "destructive" : "default"}
          disabled={otpCode.length < 6 || isPending}
          onClick={handleSubmit}
        >
          {isPending && <Spinner className="mr-2 size-4" />}
          {action === "disable" ? "Disable MFA" : "Regenerate codes"}
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            setAction(null);
            onOtpChange("");
          }}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
