"use client";

import { Button } from "@repo/web-ui/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@repo/web-ui/input-otp";
import { Label } from "@repo/web-ui/label";
import { Spinner } from "@repo/web-ui/spinner";
import { RefreshCw, ShieldOff } from "lucide-react";
import { useState } from "react";

interface MfaEnabledActionsProps {
  otpCode: string;
  onOtpChange: (val: string) => void;
  onDisable: (code: string) => void;
  onRegenerate: (code: string) => void;
  isDisabling: boolean;
  isRegenerating: boolean;
}

export function MfaEnabledActions({
  otpCode,
  onOtpChange,
  onDisable,
  onRegenerate,
  isDisabling,
  isRegenerating,
}: MfaEnabledActionsProps) {
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
