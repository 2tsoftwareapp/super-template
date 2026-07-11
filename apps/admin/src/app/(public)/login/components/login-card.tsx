"use client";

import type { UseFormReturn } from "react-hook-form";

import { Alert } from "@repo/web-core/components/alert";
import { Button } from "@repo/web-core/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/web-core/components/card";
import { Input } from "@repo/web-core/components/input";
import { Label } from "@repo/web-core/components/label";
import { PasswordInput } from "@repo/web-core/components/password-input";
import { Separator } from "@repo/web-core/components/separator";

import type { AdminLoginInput } from "@/features/auth/auth-schemas";
import type { SsoProvider } from "@/lib/api-paths";

import {
  AUTH_FORM_AUTOCOMPLETE_VALUES,
  AUTH_FORM_FIELD_NAMES,
  AUTH_MESSAGES,
  LOGIN_FORM_COPY,
  SSO_PROVIDER_OPTIONS,
} from "@/features/auth/auth-constants";

import { ProviderIcon } from "./provider-icon";

interface LoginCardProps {
  errorMessage: string | null;
  form: UseFormReturn<AdminLoginInput>;
  isPending: boolean;
  onSsoStart: (provider: SsoProvider) => void;
  onSubmit: (values: AdminLoginInput) => void;
  ssoError: boolean;
}

export function LoginCard({
  errorMessage,
  form,
  isPending,
  onSsoStart,
  onSubmit,
  ssoError,
}: LoginCardProps) {
  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="text-2xl">
          {LOGIN_FORM_COPY.adminLoginTitle}
        </CardTitle>
        <CardDescription>
          {LOGIN_FORM_COPY.seededAccountDescription}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="space-y-2">
            <Label htmlFor={AUTH_FORM_FIELD_NAMES.email}>
              {LOGIN_FORM_COPY.emailLabel}
            </Label>
            <Input
              id={AUTH_FORM_FIELD_NAMES.email}
              autoComplete={AUTH_FORM_AUTOCOMPLETE_VALUES.email}
              aria-invalid={Boolean(form.formState.errors.email)}
              {...form.register(AUTH_FORM_FIELD_NAMES.email)}
            />
            {form.formState.errors.email?.message ? (
              <p className="text-xs text-destructive">
                {form.formState.errors.email.message}
              </p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor={AUTH_FORM_FIELD_NAMES.password}>
              {LOGIN_FORM_COPY.passwordLabel}
            </Label>
            <PasswordInput
              id={AUTH_FORM_FIELD_NAMES.password}
              autoComplete={AUTH_FORM_AUTOCOMPLETE_VALUES.currentPassword}
              aria-invalid={Boolean(form.formState.errors.password)}
              {...form.register(AUTH_FORM_FIELD_NAMES.password)}
            />
            {form.formState.errors.password?.message ? (
              <p className="text-xs text-destructive">
                {form.formState.errors.password.message}
              </p>
            ) : null}
          </div>
          {errorMessage ? <Alert>{errorMessage}</Alert> : null}
          <Button className="w-full" type="submit" disabled={isPending}>
            {isPending ? LOGIN_FORM_COPY.signingIn : LOGIN_FORM_COPY.signIn}
          </Button>
        </form>

        <div className="relative my-4">
          <Separator />
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
            {LOGIN_FORM_COPY.continueWith}
          </span>
        </div>

        <div className="space-y-2">
          {SSO_PROVIDER_OPTIONS.map((item) => (
            <Button
              key={item.provider}
              variant="outline"
              className="w-full"
              onClick={() => onSsoStart(item.provider)}
            >
              <ProviderIcon provider={item.provider} />
              {item.label}
            </Button>
          ))}
        </div>

        {ssoError ? (
          <Alert className="mt-4">{AUTH_MESSAGES.ssoFailed}</Alert>
        ) : null}
      </CardContent>
    </Card>
  );
}
