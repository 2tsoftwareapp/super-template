"use client";

import type { UseFormReturn } from "react-hook-form";

import { Alert } from "@repo/web-ui/alert";
import { Button } from "@repo/web-ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/web-ui/card";
import { Input } from "@repo/web-ui/input";
import { Label } from "@repo/web-ui/label";

import type { MfaChallengeInput } from "@/features/auth/model/auth.schemas";

import {
  AUTH_FORM_FIELD_NAMES,
  LOGIN_FORM_COPY,
} from "@/features/auth/model/auth.constants";

interface MfaChallengeCardProps {
  errorMessage: string | null;
  form: UseFormReturn<MfaChallengeInput>;
  isPending: boolean;
  onBack: () => void;
  onSubmit: (values: MfaChallengeInput) => void;
}

export function MfaChallengeCard({
  errorMessage,
  form,
  isPending,
  onBack,
  onSubmit,
}: MfaChallengeCardProps) {
  const codeError = form.formState.errors[AUTH_FORM_FIELD_NAMES.code]?.message;

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="text-2xl">
          {LOGIN_FORM_COPY.verifyIdentityTitle}
        </CardTitle>
        <CardDescription>
          {LOGIN_FORM_COPY.verificationDescription}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="space-y-2">
            <Label htmlFor={AUTH_FORM_FIELD_NAMES.code}>
              {LOGIN_FORM_COPY.authCodeLabel}
            </Label>
            <Input
              id={AUTH_FORM_FIELD_NAMES.code}
              placeholder={LOGIN_FORM_COPY.mfaCodePlaceholder}
              maxLength={6}
              className="text-center font-mono text-2xl tracking-[0.5em]"
              {...form.register(AUTH_FORM_FIELD_NAMES.code)}
            />
            {codeError ? (
              <p className="text-xs text-destructive">{codeError}</p>
            ) : null}
          </div>
          {errorMessage && !codeError ? <Alert>{errorMessage}</Alert> : null}
          <Button className="w-full" type="submit" disabled={isPending}>
            {isPending ? LOGIN_FORM_COPY.verifying : LOGIN_FORM_COPY.verify}
          </Button>
          <Button
            variant="ghost"
            className="w-full"
            type="button"
            onClick={onBack}
          >
            {LOGIN_FORM_COPY.backToLogin}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
