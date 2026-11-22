"use client";

import { useState, type FormEvent } from "react";

import { TextField } from "@/components/text-field";
import { Button } from "@/components/ui/button";

export interface NewUser {
  email: string;
  displayName: string;
  password: string;
}

const EMPTY: NewUser = { email: "", displayName: "", password: "" };

export function UserCreateForm({ onCreate }: { onCreate: (user: NewUser) => Promise<boolean> }) {
  const [form, setForm] = useState<NewUser>(EMPTY);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setPending(true);

    if (await onCreate(form)) {
      setForm(EMPTY);
    }

    setPending(false);
  }

  return (
    <form onSubmit={onSubmit} className="grid items-end gap-4 sm:grid-cols-[1fr_1fr_1fr_auto]">
      <TextField
        id="new-email"
        label="Email"
        type="email"
        required
        value={form.email}
        onChange={(event) => setForm({ ...form, email: event.target.value })}
      />
      <TextField
        id="new-name"
        label="Display name"
        required
        value={form.displayName}
        onChange={(event) => setForm({ ...form, displayName: event.target.value })}
      />
      <TextField
        id="new-password"
        label="Password"
        type="password"
        placeholder="At least 8 characters"
        required
        minLength={8}
        value={form.password}
        onChange={(event) => setForm({ ...form, password: event.target.value })}
      />
      <Button type="submit" disabled={pending}>
        Create user
      </Button>
    </form>
  );
}
