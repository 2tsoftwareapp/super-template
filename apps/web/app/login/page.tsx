"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { AuthCard } from "@/components/auth/auth-card";
import { useFormAction } from "@/components/auth/use-form-action";
import { TextField } from "@/components/text-field";
import { postJson } from "@/lib/post-json";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const form = useFormAction(async () => {
    const failure = await postJson("/api/auth/login", { email, password });
    if (!failure) {
      router.push("/account");
      router.refresh();
    }
    return failure;
  });

  return (
    <AuthCard
      title="Sign in"
      description="Welcome back."
      submitLabel="Sign in"
      {...form}
      onSubmit={form.submit}
      footer={
        <>
          <Link href="/register" className="underline-offset-4 hover:underline">
            Create an account
          </Link>
          <Link href="/forgot-password" className="underline-offset-4 hover:underline">
            Forgot password?
          </Link>
        </>
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
      <TextField
        id="password"
        label="Password"
        type="password"
        autoComplete="current-password"
        required
        value={password}
        onChange={(event) => setPassword(event.target.value)}
      />
    </AuthCard>
  );
}
