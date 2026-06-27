"use client";

import { standardSchemaResolver as zodResolver } from "@hookform/resolvers/standard-schema";
import { useMutation } from "@tanstack/react-query";
import { CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import type { ForgotPasswordInput } from "@/lib/api-types";

import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { webFetch } from "@/lib/http";

const schema = z.object({
  email: z.email("Please enter a valid email address."),
});

export default function ForgotPasswordPage() {
  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
  });

  const { errors } = form.formState;

  const mutation = useMutation({
    mutationFn: (values: ForgotPasswordInput) =>
      webFetch("/api/bff/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify(values),
      }),
    onSuccess: () =>
      toast.success("If that email has an account, a reset link is on its way."),
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <AuthShell
      eyebrow="Password recovery"
      title="Forgot your password?"
      body="Enter your email address and we'll send you a link to reset your password."
      footer={
        <p className="text-sm text-muted-foreground">
          Remembered it?{" "}
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
            Check your inbox — if an account exists for that email, a reset link
            has been sent.
          </p>
          <Button
            variant="outline"
            className="mt-2 w-full"
            onClick={() => {
              mutation.reset();
              form.reset();
            }}
          >
            Send another link
          </Button>
        </div>
      ) : (
        <form
          className="space-y-4"
          onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
        >
          <div className="space-y-1.5">
            <Label htmlFor="email">Email address</Label>
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
              <p className="text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>
          <Button
            className="w-full"
            type="submit"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "Sending…" : "Send reset link"}
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
