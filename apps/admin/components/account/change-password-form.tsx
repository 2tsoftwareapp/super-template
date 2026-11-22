"use client";

import { useState, type FormEvent } from "react";
import { errorMessage, sendJson } from "@lean/next-bff/client";

import { FormError } from "@/components/form-error";
import { TextField } from "@/components/text-field";
import { Button } from "@/components/ui/button";

const EMPTY = { currentPassword: "", newPassword: "", confirm: "" };

type FieldName = keyof typeof EMPTY;
type FieldProps = (name: FieldName) => {
  value: string;
  onChange: (event: { target: { value: string } }) => void;
};

function PasswordFields({ field }: { field: FieldProps }) {
  return (
    <>
      <TextField
        id="current-password"
        label="Current password"
        type="password"
        autoComplete="current-password"
        required
        {...field("currentPassword")}
      />
      <TextField
        id="new-password"
        label="New password"
        type="password"
        autoComplete="new-password"
        minLength={8}
        required
        {...field("newPassword")}
      />
      <TextField
        id="confirm-password"
        label="Repeat new password"
        type="password"
        autoComplete="new-password"
        minLength={8}
        required
        {...field("confirm")}
      />
    </>
  );
}

export function ChangePasswordForm() {
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, setPending] = useState(false);

  const field: FieldProps = (name) => ({
    value: form[name],
    onChange: (event: { target: { value: string } }) =>
      setForm({ ...form, [name]: event.target.value }),
  });

  async function onSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError(null);
    setDone(false);

    if (form.newPassword !== form.confirm) {
      setError("The new passwords do not match");
      return;
    }

    setPending(true);
    const { currentPassword, newPassword } = form;
    const response = await sendJson("/api/auth/change-password", "POST", {
      currentPassword,
      newPassword,
    });
    setPending(false);

    if (!response.ok) {
      setError(await errorMessage(response, "Could not change the password"));
      return;
    }

    setForm(EMPTY);
    setDone(true);
  }

  return (
    <form onSubmit={onSubmit} className="grid max-w-sm gap-4">
      <PasswordFields field={field} />
      <FormError message={error} />
      {done ? (
        <p role="status" className="text-sm text-muted-foreground">
          Password changed. Every other device has been signed out.
        </p>
      ) : null}
      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Saving…" : "Change password"}
      </Button>
    </form>
  );
}
