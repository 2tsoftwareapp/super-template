"use client";

import Link from "next/link";
import { useState } from "react";

import { AuthCard } from "@/components/auth/auth-card";
import { useFormAction } from "@/components/auth/use-form-action";
import { TextField } from "@/components/text-field";
import { postJson } from "@/lib/post-json";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const form = useFormAction(async () => {
    const failure = await postJson("/api/auth/forgot-password", { email });
    setSent(!failure);
    return failure;
  });

  return (
    <AuthCard
      title="Forgot your password?"
      description="We mail you a link to choose a new one. It works once, for one hour."
      submitLabel="Send reset link"
      {...form}
      onSubmit={form.submit}
      footer={
        <Link href="/login" className="underline-offset-4 hover:underline">
          Back to sign in
        </Link>
      }
    >
      <TextField
        id="email"
        label="Email"
        type="email"
        autoComplete="email"
        required
        value={email}
        onChange={(event) => setEmail(event.target.value)}
      />
      {sent ? (
        <p role="status" className="text-sm text-muted-foreground">
          If an account exists for {email}, a reset link is on its way. Locally, open Mailpit at
          http://localhost:8025.
        </p>
      ) : null}
    </AuthCard>
  );
}
