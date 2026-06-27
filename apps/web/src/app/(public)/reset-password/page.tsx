"use client";

import { standardSchemaResolver as zodResolver } from "@hookform/resolvers/standard-schema";
import { useMutation } from "@tanstack/react-query";
import { CheckCircle2, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import type { ResetPasswordInput } from "@/lib/api-types";

import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { webFetch } from "@/lib/http";

const schema = z.object({
  token: z.string().min(1, "Reset token is required."),
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter.")
    .regex(/[0-9]/, "Password must contain at least one number."),
});

export default function ResetPasswordPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<ResetPasswordInput>({
    resolver: zodResolver(schema),
    defaultValues: {
      token: "",
      newPassword: "",
    },
  });

  const { errors } = form.formState;

  useEffect(() => {
    const token =
      new URLSearchParams(window.location.search).get("token") ?? "";
    form.setValue("token", token);
  }, [form]);

  const mutation = useMutation({
    mutationFn: (values: ResetPasswordInput) =>
      webFetch("/api/bff/auth/reset-password", {
        method: "POST",
        body: JSON.stringify(values),
      }),
    onSuccess: () => {
      toast.success("Password reset successfully. You can now sign in.");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <AuthShell
      eyebrow="Password recovery"
      title="Choose a new password"
      body="Pick a strong password for your account."
      footer={
        <p className="text-sm text-muted-foreground">
          <Link
            href="/login"
            className="text-foreground underline underline-offset-4"
          >
            Back to sign in
          </Link>
        </p>
      }
    >
      {mutation.isSuccess ? (
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <CheckCircle2 className="size-10 text-green-500" />
          <p className="text-sm text-muted-foreground">
            Your password has been reset. You can now sign in with your new
            password.
          </p>
          <Button
            className="mt-2 w-full"
            onClick={() => router.push("/login")}
          >
            Go to sign in
          </Button>
        </div>
      ) : (
        <form
          className="space-y-4"
          onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
        >
          <div className="space-y-1.5">
            <Label htmlFor="token">Reset token</Label>
            <Input
              id="token"
              placeholder="Paste the token from your email"
              aria-invalid={!!errors.token}
              {...form.register("token")}
            />
            {errors.token && (
              <p className="text-xs text-destructive">{errors.token.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="newPassword">New password</Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="••••••••"
                className="pr-10"
                aria-invalid={!!errors.newPassword}
                {...form.register("newPassword")}
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
            {errors.newPassword ? (
              <p className="text-xs text-destructive">
                {errors.newPassword.message}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Min. 8 characters, one uppercase letter, one number.
              </p>
            )}
          </div>

          <Button
            className="w-full"
            type="submit"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "Resetting…" : "Reset password"}
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
