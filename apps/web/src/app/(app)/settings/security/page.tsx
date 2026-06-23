"use client";

import { standardSchemaResolver as zodResolver } from "@hookform/resolvers/standard-schema";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import type { ApiEnvelope, ChangePasswordInput } from "@/lib/api-types";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { webFetch } from "@/lib/http";

const passwordSchema = z.object({
  currentPassword: z.string().min(8),
  newPassword: z.string().min(8),
});

const codeSchema = z.object({
  code: z.string().length(6, "Code must be 6 digits"),
});

type MfaSetupData = { secret: string; otpauthUrl: string };
type MfaRecoveryData = { recoveryCodes: string[] };

function MfaSection() {
  const queryClient = useQueryClient();
  const [setupData, setSetupData] = useState<MfaSetupData | null>(null);
  const [confirmCode, setConfirmCode] = useState("");
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null);
  const [disableCode, setDisableCode] = useState("");
  const [showDisable, setShowDisable] = useState(false);

  const status = useQuery({
    queryKey: ["mfa-status"],
    queryFn: () =>
      webFetch<ApiEnvelope<{ enabled: boolean }>>("/api/bff/auth/mfa/status"),
  });

  const setupMutation = useMutation({
    mutationFn: () =>
      webFetch<ApiEnvelope<MfaSetupData>>("/api/bff/auth/mfa/setup", {
        method: "POST",
      }),
    onSuccess: (result) => {
      setSetupData(result.data);
      setConfirmCode("");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const confirmMutation = useMutation({
    mutationFn: () =>
      webFetch<ApiEnvelope<MfaRecoveryData>>("/api/bff/auth/mfa/confirm", {
        method: "POST",
        body: JSON.stringify({ code: confirmCode }),
      }),
    onSuccess: (result) => {
      setRecoveryCodes(result.data.recoveryCodes);
      setSetupData(null);
      void queryClient.invalidateQueries({ queryKey: ["mfa-status"] });
      toast.success("Two-factor authentication enabled");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const disableMutation = useMutation({
    mutationFn: () =>
      webFetch("/api/bff/auth/mfa/disable", {
        method: "POST",
        body: JSON.stringify({ code: disableCode }),
      }),
    onSuccess: () => {
      setShowDisable(false);
      setDisableCode("");
      void queryClient.invalidateQueries({ queryKey: ["mfa-status"] });
      toast.success("Two-factor authentication disabled");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const regenerateMutation = useMutation({
    mutationFn: () =>
      webFetch<ApiEnvelope<MfaRecoveryData>>(
        "/api/bff/auth/mfa/recovery-codes/regenerate",
        { method: "POST", body: JSON.stringify({ code: confirmCode }) },
      ),
    onSuccess: (result) => {
      setRecoveryCodes(result.data.recoveryCodes);
      toast.success("Recovery codes regenerated");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const enabled = status.data?.data?.enabled ?? false;

  if (status.isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Spinner className="size-5" />
      </div>
    );
  }

  if (setupData) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Scan this QR code with your authenticator app or enter the secret
          manually.
        </p>
        <div className="rounded-lg border border-border bg-muted p-4 text-center">
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(setupData.otpauthUrl)}`}
            alt="TOTP QR Code"
            className="mx-auto mb-3 size-48"
          />
          <p className="text-xs font-mono text-muted-foreground break-all">
            Secret: {setupData.secret}
          </p>
        </div>
        {recoveryCodes ? (
          <div className="space-y-2">
            <Label>Recovery codes</Label>
            <p className="text-xs text-muted-foreground">
              Save these one-time recovery codes in a safe place. Each code can
              be used once if you lose access to your authenticator app.
            </p>
            <div className="rounded-lg border border-border bg-muted p-3">
              {recoveryCodes.map((code) => (
                <p key={code} className="font-mono text-xs">
                  {code}
                </p>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const text = recoveryCodes.join("\n");
                void navigator.clipboard.writeText(text);
                toast.success("Recovery codes copied");
              }}
            >
              Copy codes
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="confirmCode">Verification code</Label>
            <Input
              id="confirmCode"
              placeholder="000000"
              maxLength={6}
              value={confirmCode}
              onChange={(e) =>
                setConfirmCode(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
            />
            <Button
              onClick={() => confirmMutation.mutate()}
              disabled={confirmCode.length !== 6 || confirmMutation.isPending}
            >
              {confirmMutation.isPending ? "Verifying..." : "Confirm & enable"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSetupData(null)}
            >
              Cancel
            </Button>
          </div>
        )}
      </div>
    );
  }

  if (enabled) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Badge variant="default" className="bg-green-500/15 text-green-700 dark:text-green-400">
            Enabled
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Two-factor authentication is active for your account.
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => regenerateMutation.mutate()}
            disabled={regenerateMutation.isPending}
          >
            Regenerate recovery codes
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDisable(!showDisable)}
          >
            Disable 2FA
          </Button>
        </div>
        {showDisable && (
          <div className="space-y-2 rounded-lg border border-border p-3">
            <Label htmlFor="disableCode">
              Enter a TOTP code to confirm disabling
            </Label>
            <div className="flex gap-2">
              <Input
                id="disableCode"
                placeholder="000000"
                maxLength={6}
                value={disableCode}
                onChange={(e) =>
                  setDisableCode(
                    e.target.value.replace(/\D/g, "").slice(0, 6),
                  )
                }
              />
              <Button
                variant="destructive"
                size="sm"
                onClick={() => disableMutation.mutate()}
                disabled={
                  disableCode.length !== 6 || disableMutation.isPending
                }
              >
                Disable
              </Button>
            </div>
          </div>
        )}
        {regenerateMutation.isSuccess && recoveryCodes && (
          <div className="space-y-2">
            <Label>New recovery codes</Label>
            <div className="rounded-lg border border-border bg-muted p-3">
              {recoveryCodes.map((code) => (
                <p key={code} className="font-mono text-xs">
                  {code}
                </p>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Add an extra layer of security to your account by enabling two-factor
        authentication.
      </p>
      <Button
        onClick={() => setupMutation.mutate()}
        disabled={setupMutation.isPending}
      >
        {setupMutation.isPending ? "Setting up..." : "Enable two-factor auth"}
      </Button>
    </div>
  );
}

export default function SecuritySettingsPage() {
  const form = useForm<ChangePasswordInput>({
    resolver: zodResolver(passwordSchema),
  });

  const mutation = useMutation({
    mutationFn: (values: ChangePasswordInput) =>
      webFetch("/api/bff/users/me/password", {
        method: "PATCH",
        body: JSON.stringify(values),
      }),
    onSuccess: () =>
      toast.success("Password changed. Other sessions were revoked."),
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <div className="max-w-3xl space-y-6">
      <Card className="border-border">
        <CardHeader className="space-y-3">
          <Badge variant="outline" className="w-fit">
            Security
          </Badge>
          <CardTitle className="text-4xl">Security</CardTitle>
          <CardDescription>
            Rotate the current password for the active account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-4"
            onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
          >
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current password</Label>
              <Input
                id="currentPassword"
                type="password"
                placeholder="Current password"
                {...form.register("currentPassword")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">New password</Label>
              <Input
                id="newPassword"
                type="password"
                placeholder="New password"
                {...form.register("newPassword")}
              />
            </div>
            <Button type="submit">Update password</Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-border">
        <CardHeader className="space-y-3">
          <Badge variant="outline" className="w-fit">
            Two-factor authentication
          </Badge>
          <CardTitle className="text-2xl">2FA</CardTitle>
          <CardDescription>
            Protect your account with time-based one-time passwords.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MfaSection />
        </CardContent>
      </Card>
    </div>
  );
}
