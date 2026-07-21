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
import { PasswordInput } from "@repo/web-ui/password-input";
import { Separator } from "@repo/web-ui/separator";

import type { AdminLoginInput } from "@/features/auth/model/auth.schemas";
import type { SsoProvider } from "@/lib/api-paths";

import { ProviderIcon } from "./provider-icon";

export interface LoginCardCopy {
  adminLoginTitle: string;
  seededAccountDescription: string;
  emailLabel: string;
  passwordLabel: string;
  signIn: string;
  signingIn: string;
  continueWith: string;
}

export interface LoginSsoProviderOption {
  label: string;
  provider: SsoProvider;
}

interface LoginCardProps {
  copy: LoginCardCopy;
  errorMessage: string | null;
  form: UseFormReturn<AdminLoginInput>;
  isPending: boolean;
  onSsoStart: (provider: SsoProvider) => void;
  onSubmit: (values: AdminLoginInput) => void;
  ssoError: boolean;
  ssoFailedMessage: string;
  ssoProviders: readonly LoginSsoProviderOption[];
}

export function LoginCard({
  copy,
  errorMessage,
  form,
  isPending,
  onSsoStart,
  onSubmit,
  ssoError,
  ssoFailedMessage,
  ssoProviders,
}: LoginCardProps) {
  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="text-2xl">{copy.adminLoginTitle}</CardTitle>
        <CardDescription>{copy.seededAccountDescription}</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="space-y-2">
            <Label htmlFor="email">{copy.emailLabel}</Label>
            <Input
              id="email"
              autoComplete="email"
              aria-invalid={Boolean(form.formState.errors.email)}
              {...form.register("email")}
            />
            {form.formState.errors.email?.message ? (
              <p className="text-xs text-destructive">
                {form.formState.errors.email.message}
              </p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">{copy.passwordLabel}</Label>
            <PasswordInput
              id="password"
              autoComplete="current-password"
              aria-invalid={Boolean(form.formState.errors.password)}
              {...form.register("password")}
            />
            {form.formState.errors.password?.message ? (
              <p className="text-xs text-destructive">
                {form.formState.errors.password.message}
              </p>
            ) : null}
          </div>
          {errorMessage ? <Alert>{errorMessage}</Alert> : null}
          <Button className="w-full" type="submit" disabled={isPending}>
            {isPending ? copy.signingIn : copy.signIn}
          </Button>
        </form>

        <div className="relative my-4">
          <Separator />
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
            {copy.continueWith}
          </span>
        </div>

        <div className="space-y-2">
          {ssoProviders.map((item) => (
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

        {ssoError ? <Alert className="mt-4">{ssoFailedMessage}</Alert> : null}
      </CardContent>
    </Card>
  );
}
