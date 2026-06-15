"use client";

import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { ForgotPasswordInput } from "@/lib/api-types";
import { webFetch } from "@/lib/http";

const schema = z.object({
  email: z.email(),
});

export default function ForgotPasswordPage() {
  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(schema),
  });

  const mutation = useMutation({
    mutationFn: (values: ForgotPasswordInput) =>
      webFetch("/api/bff/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify(values),
      }),
    onSuccess: () =>
      toast.success("If the account exists, a reset email was sent."),
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-8">
      <Card className="w-full max-w-lg">
        <h1 className="text-3xl font-semibold">Reset your password</h1>
        <p className="mt-3 text-sm text-neutral-500">
          Development emails are delivered to Mailpit.
        </p>
        <form
          className="mt-8 space-y-4"
          onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
        >
          <Input placeholder="you@example.local" {...form.register("email")} />
          <Button className="w-full" type="submit">
            Send reset email
          </Button>
        </form>
        <p className="mt-6 text-sm text-neutral-500">
          <Link href="/login" className="underline">
            Back to sign in
          </Link>
        </p>
      </Card>
    </div>
  );
}
