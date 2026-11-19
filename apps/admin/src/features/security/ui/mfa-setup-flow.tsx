"use client";

import { Button } from "@repo/web-ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/web-ui/card";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@repo/web-ui/input-otp";
import { Label } from "@repo/web-ui/label";
import { Separator } from "@repo/web-ui/separator";
import { Spinner } from "@repo/web-ui/spinner";
import { Tooltip } from "@repo/web-ui/tooltip";
import { Check, Copy, KeyRound, QrCode, Shield } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useState } from "react";
import { toast } from "sonner";

import type { MfaSetupResponse } from "@/features/security/model/security.types";

interface MfaSetupFlowProps {
  setupData: MfaSetupResponse["data"];
  otpCode: string;
  onOtpChange: (code: string) => void;
  onVerify: (code: string) => void;
  onCancel: () => void;
  isVerifying: boolean;
}

/** Presents the in-memory MFA enrollment secret and verification controls. */
export function MfaSetupFlow({
  setupData,
  otpCode,
  onOtpChange,
  onVerify,
  onCancel,
  isVerifying,
}: MfaSetupFlowProps) {
  const [copied, setCopied] = useState(false);

  const handleCopySecret = async () => {
    try {
      await navigator.clipboard.writeText(setupData.secret);
      setCopied(true);
      toast.success("Secret key copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy secret key");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Shield className="size-5 text-primary" />
          Set up two-factor authentication
        </CardTitle>
        <CardDescription>
          Protect your account with a time-based one-time password (TOTP) authenticator.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <span className="flex size-6 items-center justify-center rounded-full bg-primary/10 text-primary text-xs">
              1
            </span>
            <QrCode className="size-4 text-muted-foreground" />
            <span>Scan QR Code or enter manual secret</span>
          </div>

          <div className="flex flex-col items-center gap-4 rounded-lg border border-border bg-muted/20 p-4">
            <div className="rounded-lg border border-border bg-white p-3 shadow-xs">
              {/* SECURITY: Generate locally so the TOTP secret never leaves this origin. */}
              <QRCodeSVG
                value={setupData.otpauthUrl}
                title="QR code for authenticator app"
                size={200}
                level="M"
              />
            </div>
            <div className="flex flex-col items-center gap-2 text-center max-w-sm">
              <p className="text-xs text-muted-foreground">
                Unable to scan? Copy and enter the setup key manually in your authenticator app:
              </p>
              <div className="flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1 font-mono text-xs shadow-2xs">
                <KeyRound className="size-3.5 text-muted-foreground" />
                <code className="select-all font-semibold tracking-wider">{setupData.secret}</code>
                <Tooltip content={copied ? "Copied!" : "Copy secret key"}>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Copy setup key"
                    onClick={handleCopySecret}
                    className="size-6 ml-1"
                  >
                    {copied ? (
                      <Check className="size-3 text-primary" />
                    ) : (
                      <Copy className="size-3 text-muted-foreground" />
                    )}
                  </Button>
                </Tooltip>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <span className="flex size-6 items-center justify-center rounded-full bg-primary/10 text-primary text-xs">
              2
            </span>
            <span>Enter the 6-digit verification code from your app</span>
          </div>

          <div className="mx-auto max-w-xs space-y-3">
            <Label htmlFor="verification-otp">Verification code</Label>
            <InputOTP
              id="verification-otp"
              maxLength={6}
              value={otpCode}
              onChange={onOtpChange}
              onComplete={(code: string) => onVerify(code)}
            >
              <InputOTPGroup className="justify-center">
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
            <div className="flex gap-2 pt-2">
              <Button
                className="flex-1"
                disabled={otpCode.length < 6 || isVerifying}
                onClick={() => onVerify(otpCode)}
              >
                {isVerifying && <Spinner className="mr-2 size-4" />}
                Verify &amp; enable
              </Button>
              <Button variant="outline" onClick={onCancel} disabled={isVerifying}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
