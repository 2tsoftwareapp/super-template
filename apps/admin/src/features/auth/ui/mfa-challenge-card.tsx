"use client";

import type { UseFormReturn } from "react-hook-form";

import { Alert } from "@repo/web-ui/alert";
import { Button } from "@repo/web-ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/web-ui/card";
import { Input } from "@repo/web-ui/input";
import { Label } from "@repo/web-ui/label";

import type { MfaChallengeInput } from "@/features/auth/model/auth.schemas";

export interface MfaChallengeCardCopy {
  verifyIdentityTitle: string;
  verificationDescription: string;
  authCodeLabel: string;
  mfaCodePlaceholder: string;
  verify: string;
  verifying: string;
  backToLogin: string;
}

interface MfaChallengeCardProps {
  copy: MfaChallengeCardCopy;
  errorMessage: string | null;
  form: UseFormReturn<MfaChallengeInput>;
  isPending: boolean;
  onBack: () => void;
  onSubmit: (values: MfaChallengeInput) => void;
}

export function MfaChallengeCard({
  copy,
  errorMessage,
  form,
  isPending,
  onBack,
  onSubmit,
}: MfaChallengeCardProps) {
  const codeError = form.formState.errors.code?.message;

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="text-2xl">{copy.verifyIdentityTitle}</CardTitle>
        <CardDescription>{copy.verificationDescription}</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="space-y-2">
            <Label htmlFor="code">{copy.authCodeLabel}</Label>
            <Input
              id="code"
              placeholder={copy.mfaCodePlaceholder}
              maxLength={6}
              className="text-center font-mono text-2xl tracking-[0.5em]"
              {...form.register("code")}
            />
            {codeError ? <p className="text-xs text-destructive">{codeError}</p> : null}
          </div>
          {errorMessage && !codeError ? <Alert>{errorMessage}</Alert> : null}
          <Button className="w-full" type="submit" disabled={isPending}>
            {isPending ? copy.verifying : copy.verify}
          </Button>
          <Button variant="ghost" className="w-full" type="button" onClick={onBack}>
            {copy.backToLogin}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
