"use client";

import type { operations } from "@repo/api-contract";

import { standardSchemaResolver as zodResolver } from "@hookform/resolvers/standard-schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Alert } from "@/components/ui/alert";
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
import { PasswordInput } from "@/components/ui/password-input";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { sessionQueryKey } from "@/hooks/use-session";
import { hasAdminAppAccess } from "@/lib/admin-resources";
import { webFetch } from "@/lib/http";

type AuthLoginResponse =
  operations["AuthController_login"]["responses"][201]["content"]["application/json"];

const schema = z.object({
  email: z.email(),
  password: z.string().min(8),
});

const mfaSchema = z.object({
  code: z.string().length(6),
});

type LoginInput = z.infer<typeof schema>;

function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [mfaToken, setMfaToken] = useState<string | null>(null);
  const [mfaEmail, setMfaEmail] = useState("");
  const [mfaPassword, setMfaPassword] = useState("");

  const form = useForm<LoginInput>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "admin@example.local",
      password: "ChangeMe123!",
    },
  });

  const mfaForm = useForm<{ code: string }>({
    resolver: zodResolver(mfaSchema),
    defaultValues: { code: "" },
  });

  const ssoError = searchParams.get("error") === "sso_failed";

  const loginMutation = useMutation({
    mutationFn: async (values: LoginInput) => {
      const response = await webFetch<AuthLoginResponse>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(values),
      });

      if (response.data.mfaRequired || !response.data.user) {
        setMfaToken(response.data.mfaToken ?? null);
        setMfaEmail(values.email);
        setMfaPassword(values.password);
        throw new Error("mfa-required");
      }

      if (
        !hasAdminAppAccess({
          roles: response.data.user.roles,
          permissions: response.data.permissions ?? [],
        })
      ) {
        await webFetch("/api/auth/logout", { method: "POST" });
        throw new Error("not-admin");
      }

      return response;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: sessionQueryKey });
      router.replace("/");
    },
  });

  const mfaMutation = useMutation({
    mutationFn: async (values: { code: string }) => {
      const response = await webFetch<AuthLoginResponse>(
        "/api/auth/mfa/verify-challenge",
        {
          method: "POST",
          body: JSON.stringify({
            mfaToken,
            code: values.code,
          }),
        },
      );
      return response;
    },
    onSuccess: async (response) => {
      if (response.data.user) {
        const hasAccess = hasAdminAppAccess({
          roles: response.data.user.roles,
          permissions: response.data.permissions ?? [],
        });

        if (!hasAccess) {
          await webFetch("/api/auth/logout", { method: "POST" });
          throw new Error("not-admin");
        }
      }

      await queryClient.invalidateQueries({ queryKey: sessionQueryKey });
      router.replace("/");
    },
    onError: () => {
      mfaForm.setError("code", {
        message: "Invalid verification code. Please try again.",
      });
    },
  });

  const handleSsoStart = async (provider: string) => {
    sessionStorage.setItem("sso_provider", provider);
    const redirectUri = `${window.location.origin}/login/sso/callback`;
    try {
      const response = await fetch(
        `/api/auth/sso/${provider}/start?redirectUri=${encodeURIComponent(redirectUri)}`,
      );
      const payload = await response.json();
      const authorizationUrl = payload.data?.authorizationUrl;
      if (authorizationUrl) {
        window.location.href = authorizationUrl;
      }
    } catch {
      window.location.href = `/api/auth/sso/${provider}/start?redirectUri=${encodeURIComponent(redirectUri)}`;
    }
  };

  if (mfaToken) {
    return (
      <div className="min-h-screen px-4 py-6 md:px-6 lg:px-8">
        <div className="mx-auto grid min-h-[calc(100vh-3rem)] max-w-6xl items-center gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="space-y-6 py-4 lg:py-10">
            <Badge variant="outline" className="w-fit">
              Admin workspace
            </Badge>
            <div className="max-w-2xl space-y-4">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                Two-factor verification
              </p>
              <h1 className="text-4xl font-semibold leading-tight md:text-6xl">
                Enter your verification code
              </h1>
              <p className="max-w-xl text-sm leading-7 text-muted-foreground md:text-base">
                Open your authenticator app and enter the 6-digit code to
                complete sign-in.
              </p>
            </div>
          </section>
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-2xl">Verify your identity</CardTitle>
              <CardDescription>
                Enter the 6-digit code from your authenticator app.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                className="space-y-4"
                onSubmit={mfaForm.handleSubmit((values) =>
                  mfaMutation.mutate(values),
                )}
              >
                <div className="space-y-2">
                  <Label htmlFor="mfa-code">Authentication code</Label>
                  <Input
                    id="mfa-code"
                    placeholder="000000"
                    maxLength={6}
                    className="text-center text-2xl tracking-[0.5em] font-mono"
                    {...mfaForm.register("code")}
                  />
                  {mfaForm.formState.errors.code ? (
                    <p className="text-xs text-destructive">
                      {mfaForm.formState.errors.code.message}
                    </p>
                  ) : null}
                </div>
                {mfaMutation.isError && !mfaForm.formState.errors.code && (
                  <Alert>
                    Invalid verification code. Please try again.
                  </Alert>
                )}
                <Button
                  className="w-full"
                  type="submit"
                  disabled={mfaMutation.isPending}
                >
                  {mfaMutation.isPending ? "Verifying…" : "Verify"}
                </Button>
                <Button
                  variant="ghost"
                  className="w-full"
                  type="button"
                  onClick={() => {
                    setMfaToken(null);
                    setMfaEmail("");
                    setMfaPassword("");
                    mfaForm.reset();
                  }}
                >
                  Back to login
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-6 md:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-3rem)] max-w-6xl items-center gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="space-y-6 py-4 lg:py-10">
          <Badge variant="outline" className="w-fit">
            Admin workspace
          </Badge>
          <div className="max-w-2xl space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
              Separate project
            </p>
            <h1 className="text-4xl font-semibold leading-tight md:text-6xl">
              Sign in to the admin app
            </h1>
            <p className="max-w-xl text-sm leading-7 text-muted-foreground md:text-base">
              This app is split away from the client web. It owns management
              workflows, review queues, and system controls.
            </p>
          </div>
        </section>
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-2xl">Admin login</CardTitle>
            <CardDescription>Use the seeded admin account.</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="space-y-4"
              onSubmit={form.handleSubmit((values) => {
                void loginMutation.mutateAsync(values);
              })}
            >
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" {...form.register("email")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <PasswordInput id="password" {...form.register("password")} />
              </div>
              {loginMutation.isError && (
                <Alert>
                  {loginMutation.error instanceof Error &&
                  loginMutation.error.message === "mfa-required"
                    ? "This account requires two-factor verification. Enter your code below."
                    : loginMutation.error instanceof Error &&
                        loginMutation.error.message === "not-admin"
                      ? "Access denied. This portal is for administrators only."
                      : loginMutation.error instanceof Error &&
                          loginMutation.error.message.includes("401")
                        ? "Invalid email or password."
                        : loginMutation.error instanceof Error &&
                            loginMutation.error.message.includes("403")
                          ? "Your account is not active or has not been verified."
                          : loginMutation.error instanceof Error &&
                              loginMutation.error.message.includes(
                                "failed to fetch",
                              )
                            ? "Cannot reach the API. Make sure the server is running."
                            : "Sign in failed. Please try again."}
                </Alert>
              )}
              <Button
                className="w-full"
                type="submit"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? "Signing in…" : "Sign in"}
              </Button>
            </form>

            <div className="relative my-4">
              <Separator />
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
                or continue with
              </span>
            </div>

            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => handleSsoStart("google")}
              >
                <svg
                  className="mr-2 size-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Continue with Google
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => handleSsoStart("apple")}
              >
                <svg
                  className="mr-2 size-4"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                </svg>
                Continue with Apple
              </Button>
            </div>

            {ssoError && (
              <Alert className="mt-4">
                SSO sign-in failed. Please try again or use email/password.
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function Page() {
  return <LoginPage />;
}
