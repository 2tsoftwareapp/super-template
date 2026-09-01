"use client";

import { Alert } from "@repo/web-ui/alert";
import { Button } from "@repo/web-ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/web-ui/card";
import { Check, Copy, Download, KeyRound, ShieldAlert } from "lucide-react";
import { useCallback, useState } from "react";

interface MfaRecoveryCodesProps {
  codes: string[];
  onDone: () => void;
  onCopy: () => void;
  onCopyError: () => void;
}

export function MfaRecoveryCodes({ codes, onDone, onCopy, onCopyError }: MfaRecoveryCodesProps) {
  const [copied, setCopied] = useState(false);

  const copyCodes = useCallback(() => {
    void navigator.clipboard
      .writeText(codes.join("\n"))
      .then(() => {
        setCopied(true);
        onCopy?.();
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => onCopyError?.());
  }, [codes, onCopy, onCopyError]);

  const downloadCodes = useCallback(() => {
    const text = `Two-Factor Authentication Recovery Codes\nGenerated: ${new Date().toISOString()}\n\n${codes.join("\n")}\n\nKeep these codes in a secure place. Each code can only be used once.`;
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `recovery-codes-${new Date().toISOString().slice(0, 10)}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  }, [codes]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <KeyRound className="size-5 text-primary" />
          Two-Factor Recovery Codes
        </CardTitle>
        <CardDescription>
          Save these backup recovery codes in a secure password manager. Each code is single-use if
          you lose access to your primary authenticator device.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <Alert variant="warning">
          <div className="flex items-center gap-2">
            <ShieldAlert className="size-4 shrink-0" />
            <span>Store these codes securely. They will not be displayed again.</span>
          </div>
        </Alert>

        <div className="grid grid-cols-2 gap-2.5 rounded-lg border border-border bg-muted/40 p-4 font-mono text-sm shadow-2xs sm:grid-cols-2">
          {codes.map((code, index) => (
            <div
              key={code}
              className="flex items-center justify-between rounded-md border border-border/70 bg-background px-3 py-2 text-xs font-semibold tracking-wider text-foreground select-all"
            >
              <span className="text-muted-foreground text-[11px] font-normal mr-2">
                {index + 1}.
              </span>
              <span>{code}</span>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={copyCodes}>
              {copied ? (
                <Check className="mr-1.5 size-3.5 text-primary" />
              ) : (
                <Copy className="mr-1.5 size-3.5" />
              )}
              {copied ? "Copied to clipboard" : "Copy all codes"}
            </Button>
            <Button variant="outline" size="sm" onClick={downloadCodes}>
              <Download className="mr-1.5 size-3.5" />
              Download (.txt)
            </Button>
          </div>
          <Button size="sm" onClick={onDone}>
            I have saved my codes
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
