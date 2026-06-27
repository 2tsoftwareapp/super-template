"use client";

import { standardSchemaResolver as zodResolver } from "@hookform/resolvers/standard-schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import type { AuthLoginResponse, LoginInput } from "@/lib/api-types";

import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";
import { webFetch } from "@/lib/http";
import { getPostLoginPath } from "@/lib/navigation";

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0012 2z" />
    </svg>
  );
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

function AppleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.54 9.103 1.519 12.087 1.013 1.454 2.208 3.09 3.792 3.029 1.52-.065 2.09-.987 3.925-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.56-1.701z" />
    </svg>
  );
}

const schema = z.object({
  email: z.string().email("Please enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

interface MfaVerifyResponse {
  data: {
    accessToken: string;
    refreshToken: string;
    user: { displayName: string };
  };
}

export default function LoginPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [mfaToken, setMfaToken] = useState<string | null>(null);
  const [mfaCode, setMfaCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<LoginInput>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const { errors } = form.formState;

  const mutation = useMutation({
    mutationFn: (values: LoginInput) =>
      webFetch<AuthLoginResponse>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(values),
      }),
    onSuccess: async (result) => {
      if (result.data.mfaRequired && result.data.mfaToken) {
        setMfaToken(result.data.mfaToken);
        return;
      }

      if (!result.data.user) {
        toast.error("Sign-in succeeded but no user data was returned.");
        return;
      }

      await queryClient.invalidateQueries({ queryKey: ["session"] });
      toast.success(`Welcome back, ${result.data.user.displayName}`);
      router.replace(getPostLoginPath());
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const mfaMutation = useMutation({
    mutationFn: (code: string) =>
      webFetch<MfaVerifyResponse>("/api/auth/mfa/verify-challenge", {
        method: "POST",
        body: JSON.stringify({ mfaToken, code }),
      }),
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: ["session"] });
      toast.success(`Welcome back, ${result.data.user.displayName}`);
      router.replace(getPostLoginPath());
    },
    onError: (error: Error) => {
      setMfaCode("");
      toast.error(error.message);
    },
  });

  const startSsoLogin = async (provider: string) => {
    try {
      const result = await webFetch<{ data: { authorizationUrl: string } }>(
        `/api/auth/sso/${provider}/start?redirectUri=${encodeURIComponent(window.location.origin + "/login/sso/callback?provider=" + provider)}`,
      );
      window.location.href = result.data.authorizationUrl;
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to start SSO login.",
      );
    }
  };

  const handleOtpChange = (value: string) => {
    setMfaCode(value);
    if (value.length === 6 && !mfaMutation.isPending) {
      mfaMutation.mutate(value);
    }
  };

  return (
    <AuthShell
      eyebrow="Welcome back"
      title="Sign in to your account"
      body="Enter your credentials below to access your workspace."
      footer={
        <div className="flex flex-col gap-1.5 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>
            No account yet?{" "}
            <Link href="/register" className="text-foreground underline underline-offset-4">
              Create one
            </Link>
          </p>
          <Link
            href="/forgot-password"
            className="text-foreground underline underline-offset-4"
          >
            Forgot password?
          </Link>
        </div>
      }
    >
      <div className="space-y-4">
        {mfaToken ? (
          <div className="space-y-5">
            <div className="space-y-1.5">
              <p className="text-sm font-medium">Two-factor authentication</p>
              <p className="text-xs text-muted-foreground">
                Enter the 6-digit code from your authenticator app to continue.
              </p>
            </div>

            <div className="space-y-3">
              <Label>Authentication code</Label>
              <InputOTP
                maxLength={6}
                value={mfaCode}
                onChange={handleOtpChange}
                autoFocus
                disabled={mfaMutation.isPending}
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                </InputOTPGroup>
                <InputOTPSeparator />
                <InputOTPGroup>
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
              {mfaMutation.isPending && (
                <p className="text-xs text-muted-foreground">Verifying…</p>
              )}
            </div>

            <Button
              className="w-full"
              variant="outline"
              type="button"
              disabled={mfaMutation.isPending}
              onClick={() => {
                setMfaToken(null);
                setMfaCode("");
              }}
            >
              Back to sign in
            </Button>
          </div>
        ) : (
          <>
            <form
              className="space-y-4"
              onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
            >
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  autoFocus
                  placeholder="you@example.com"
                  aria-invalid={!!errors.email}
                  {...form.register("email")}
                />
                {errors.email && (
                  <p className="text-xs text-destructive">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className="pr-10"
                    aria-invalid={!!errors.password}
                    {...form.register("password")}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-destructive">
                    {errors.password.message}
                  </p>
                )}
              </div>

              <Button
                className="w-full"
                type="submit"
                disabled={mutation.isPending}
              >
                {mutation.isPending ? "Signing in…" : "Sign in"}
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <Button
                variant="outline"
                type="button"
                className="gap-2"
                onClick={() => startSsoLogin("github")}
              >
                <GithubIcon className="size-4" />
                GitHub
              </Button>
              <Button
                variant="outline"
                type="button"
                className="gap-2"
                onClick={() => startSsoLogin("google")}
              >
                <GoogleIcon className="size-4" />
                Google
              </Button>
              <Button
                variant="outline"
                type="button"
                className="gap-2"
                onClick={() => startSsoLogin("apple")}
              >
                <AppleIcon className="size-4" />
                Apple
              </Button>
            </div>
          </>
        )}
      </div>
    </AuthShell>
  );
}
