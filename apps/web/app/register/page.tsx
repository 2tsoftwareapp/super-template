"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { AuthCard } from "@/components/auth/auth-card";
import { useFormAction } from "@/components/auth/use-form-action";
import { TextField } from "@/components/text-field";
import { postJson } from "@/lib/post-json";

export default function RegisterPage() {
  const router = useRouter();
  const [input, setInput] = useState({ displayName: "", email: "", password: "" });
  const form = useFormAction(async () => {
    const failure = await postJson("/api/auth/register", input);
    if (!failure) {
      router.push("/account");
      router.refresh();
    }
    return failure;
  });
  const bind = (name: keyof typeof input) => ({
    value: input[name],
    onChange: (event: { target: { value: string } }) =>
      setInput({ ...input, [name]: event.target.value }),
  });

  return (
    <AuthCard
      title="Create an account"
      description="It takes ten seconds."
      submitLabel="Create account"
      {...form}
      onSubmit={form.submit}
      footer={
        <Link href="/login" className="underline-offset-4 hover:underline">
          Already have an account? Sign in
        </Link>
      }
    >
      <TextField id="name" label="Name" autoComplete="name" required {...bind("displayName")} />
      <TextField
        id="email"
        label="Email"
        type="email"
        autoComplete="email"
        required
        {...bind("email")}
      />
      <TextField
        id="password"
        label="Password (8+ characters)"
        type="password"
        autoComplete="new-password"
        minLength={8}
        required
        {...bind("password")}
      />
    </AuthCard>
  );
}
