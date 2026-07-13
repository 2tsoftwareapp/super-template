"use client";

import { Alert } from "@repo/web-ui/alert";
import { Button } from "@repo/web-ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/web-ui/card";
import { Copy, KeyRound } from "lucide-react";
import { useCallback } from "react";
import { toast } from "sonner";

interface MfaRecoveryCodesProps {
  codes: string[];
  onDone: () => void;
}

export function MfaRecoveryCodes({ codes, onDone }: MfaRecoveryCodesProps) {
  const copyCodes = useCallback(() => {
    void navigator.clipboard
      .writeText(codes.join("\n"))
      .then(() => toast.success("Recovery codes copied to clipboard"))
      .catch(() => toast.error("Could not copy recovery codes"));
  }, [codes]);

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
          {codes.map((code) => (
            <span key={code} className="select-all">
              {code}
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={copyCodes}>
            <Copy className="mr-2 size-3.5" />
            Copy codes
          </Button>
          <Button size="sm" onClick={onDone}>
            Done
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
