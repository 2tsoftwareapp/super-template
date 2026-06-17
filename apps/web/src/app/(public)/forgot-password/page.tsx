"use client";

import { standardSchemaResolver as zodResolver } from "@hookform/resolvers/standard-schema";
import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import type { ForgotPasswordInput } from "@/lib/api-types";

import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
    <AuthShell
      eyebrow="Password recovery"
      title="Reset your password"
      body="Development emails are delivered to Mailpit."
      footer={
        <p>
          <Link href="/login">Back to sign in</Link>
        </p>
      }
    >
      <Card className="border-0 bg-transparent shadow-none">
        <CardContent className="space-y-4 p-6">
          <form
            className="space-y-4"
            onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
          >
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                placeholder="you@example.local"
                {...form.register("email")}
              />
            </div>
            <Button className="w-full" type="submit">
              Send reset email
            </Button>
          </form>
        </CardContent>
      </Card>
    </AuthShell>
  );
}
