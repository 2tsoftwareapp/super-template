"use client";

import Link from "next/link";
import { useState } from "react";

import { AuthCard } from "@/components/auth/auth-card";
import { useFormAction } from "@/components/auth/use-form-action";
import { TextField } from "@/components/text-field";
import { postJson } from "@/lib/post-json";

export function ResetPasswordForm({ token }: { token: string }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [done, setDone] = useState(false);
  const form = useFormAction(async () => {
    if (password !== confirm) return "The passwords do not match";
    const failure = await postJson("/api/auth/reset-password", { token, password });
    setDone(!failure);
    return failure;
  });

  return (
    <AuthCard
      title="Choose a new password"
      description="Every device signed in to this account is signed out."
      submitLabel="Set password"
      {...form}
      onSubmit={form.submit}
      footer={
        <Link href="/login" className="underline-offset-4 hover:underline">
          Back to sign in
        </Link>
      }
    >
      <TextField
        id="password"
        label="New password"
        type="password"
        autoComplete="new-password"
        minLength={8}
        required
        value={password}
        onChange={(event) => setPassword(event.target.value)}
      />
      <TextField
        id="confirm"
        label="Repeat new password"
        type="password"
        autoComplete="new-password"
        minLength={8}
        required
        value={confirm}
        onChange={(event) => setConfirm(event.target.value)}
      />
      {done ? (
        <p role="status" className="text-sm text-muted-foreground">
          Password updated. You can sign in now.
        </p>
      ) : null}
    </AuthCard>
  );
}
