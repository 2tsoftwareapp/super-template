"use client";

import { standardSchemaResolver as zodResolver } from "@hookform/resolvers/standard-schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Apple, Chrome } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import type { AuthLoginResponse, LoginInput } from "@/lib/api-types";

import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { webFetch } from "@/lib/http";
import { getPostLoginPath } from "@/lib/navigation";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
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
  const form = useForm<LoginInput>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "admin@example.local",
      password: "ChangeMe123!",
    },
  });

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

  const handleMfaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mfaCode.length === 6) {
      mfaMutation.mutate(mfaCode);
    }
  };

  return (
    <AuthShell
      eyebrow="Session access"
      title="Sign in to the starter"
      body="Use the seeded development accounts or your own registered user."
      footer={
        <p className="text-sm text-neutral-500">
          No account yet?{" "}
          <Link
            href="/register"
            className="text-neutral-950 underline dark:text-white"
          >
            Register
          </Link>
        </p>
      }
    >
      <Card className="border-0 bg-transparent shadow-none">
        <CardContent className="space-y-4 p-6">
          {mfaToken ? (
            <form className="space-y-4" onSubmit={handleMfaSubmit}>
              <div className="space-y-2">
                <Label htmlFor="mfaCode">
                  Two-factor authentication code
                </Label>
                <Input
                  id="mfaCode"
                  placeholder="000000"
                  maxLength={6}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={mfaCode}
                  onChange={(e) =>
                    setMfaCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Enter the 6-digit code from your authenticator app.
                </p>
              </div>
              <Button
                className="w-full"
                type="submit"
                disabled={mfaCode.length !== 6 || mfaMutation.isPending}
              >
                {mfaMutation.isPending ? "Verifying..." : "Verify code"}
              </Button>
              <Button
                className="w-full"
                variant="outline"
                type="button"
                onClick={() => {
                  setMfaToken(null);
                  setMfaCode("");
                }}
              >
                Back to sign in
              </Button>
            </form>
          ) : (
            <>
              <form
                className="space-y-4"
                onSubmit={form.handleSubmit((values) =>
                  mutation.mutate(values),
                )}
              >
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" {...form.register("email")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    {...form.register("password")}
                  />
                </div>
                <Button
                  className="w-full"
                  type="submit"
                  disabled={mutation.isPending}
                >
                  {mutation.isPending ? "Signing in..." : "Sign in"}
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

              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => startSsoLogin("google")}
                >
                  <Chrome className="mr-2 size-4" />
                  Google
                </Button>
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => startSsoLogin("apple")}
                >
                  <Apple className="mr-2 size-4" />
                  Apple
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
      <div className="flex justify-between text-sm text-muted-foreground">
        <Link href="/forgot-password">Forgot password?</Link>
        <Link href="/">Back home</Link>
      </div>
    </AuthShell>
  );
}
