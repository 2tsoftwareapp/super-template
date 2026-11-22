"use client";

import { useState } from "react";

import { useFormAction } from "@/components/auth/use-form-action";
import { FormError } from "@/components/form-error";
import { TextField } from "@/components/text-field";
import { Button } from "@/components/ui/button";
import { postJson } from "@/lib/post-json";

const EMPTY = { currentPassword: "", newPassword: "", confirm: "" };

export function ChangePasswordForm() {
  const [input, setInput] = useState(EMPTY);
  const [done, setDone] = useState(false);
  const form = useFormAction(async () => {
    if (input.newPassword !== input.confirm) return "The new passwords do not match";
    const { currentPassword, newPassword } = input;
    const failure = await postJson("/api/auth/change-password", { currentPassword, newPassword });
    setDone(!failure);
    if (!failure) setInput(EMPTY);
    return failure;
  });
  const bind = (name: keyof typeof EMPTY) => ({
    value: input[name],
    onChange: (event: { target: { value: string } }) =>
      setInput({ ...input, [name]: event.target.value }),
  });

  return (
    <form onSubmit={form.submit} className="grid max-w-sm gap-4">
      <TextField
        id="current-password"
        label="Current password"
        type="password"
        autoComplete="current-password"
        required
        {...bind("currentPassword")}
      />
      <TextField
        id="new-password"
        label="New password"
        type="password"
        autoComplete="new-password"
        minLength={8}
        required
        {...bind("newPassword")}
      />
      <TextField
        id="confirm-password"
        label="Repeat new password"
        type="password"
        autoComplete="new-password"
        minLength={8}
        required
        {...bind("confirm")}
      />
      <FormError message={form.error} />
      {done ? (
        <p role="status" className="text-sm text-muted-foreground">
          Password changed. Every other device has been signed out.
        </p>
      ) : null}
      <Button type="submit" className="w-fit" disabled={form.pending}>
        Change password
      </Button>
    </form>
  );
}
