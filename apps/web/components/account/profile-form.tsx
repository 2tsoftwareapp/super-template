"use client";

import { useState } from "react";

import { useFormAction } from "@/components/auth/use-form-action";
import { FormError } from "@/components/form-error";
import { TextField } from "@/components/text-field";
import { Button } from "@/components/ui/button";
import { postJson } from "@/lib/post-json";

export function ProfileForm({ email, displayName }: { email: string; displayName: string }) {
  const [name, setName] = useState(displayName);
  const [saved, setSaved] = useState(false);
  const form = useFormAction(async () => {
    const failure = await postJson("/api/auth/me", { displayName: name }, "PATCH");
    setSaved(!failure);
    return failure;
  });

  return (
    <form onSubmit={form.submit} className="grid max-w-sm gap-4">
      <TextField id="email" label="Email" value={email} disabled readOnly />
      <TextField
        id="display-name"
        label="Name"
        required
        value={name}
        onChange={(event) => {
          setName(event.target.value);
          setSaved(false);
        }}
      />
      <FormError message={form.error} />
      {saved ? <p className="text-sm text-muted-foreground">Saved.</p> : null}
      <Button type="submit" className="w-fit" disabled={form.pending}>
        Save
      </Button>
    </form>
  );
}
