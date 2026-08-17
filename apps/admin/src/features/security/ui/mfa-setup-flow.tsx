"use client";

import { Button } from "@repo/web-ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/web-ui/card";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@repo/web-ui/input-otp";
import { Label } from "@repo/web-ui/label";
import { Separator } from "@repo/web-ui/separator";
import { Spinner } from "@repo/web-ui/spinner";
import { Shield } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

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
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Shield className="size-5" />
          Set up two-factor authentication
        </CardTitle>
        <CardDescription>
          Scan the QR code with your authenticator app, then enter the verification code below.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col items-center gap-4">
          <div className="rounded-lg border border-border bg-white p-3">
            {/* SECURITY: Generate locally so the TOTP secret never leaves this origin. */}
            <QRCodeSVG
              value={setupData.otpauthUrl}
              title="QR code for authenticator app"
              size={200}
              level="M"
            />
          </div>
          <div className="text-center">
            <p className="mb-1 text-xs text-muted-foreground">Or enter this key manually:</p>
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
            onChange={onOtpChange}
            onComplete={(code: string) => onVerify(code)}
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
              disabled={otpCode.length < 6 || isVerifying}
              onClick={() => onVerify(otpCode)}
            >
              {isVerifying && <Spinner className="mr-2 size-4" />}
              Verify &amp; enable
            </Button>
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
