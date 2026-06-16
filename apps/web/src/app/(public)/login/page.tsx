"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { standardSchemaResolver as zodResolver } from "@hookform/resolvers/standard-schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { AuthLoginResponse, LoginInput } from "@/lib/api-types";
import { webFetch } from "@/lib/http";

const schema = z.object({
  email: z.email(),
  password: z.string().min(8),
});

export default function LoginPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const form = useForm<LoginInput>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "admin@example.local",
      password: "ChangeMe123!",
    },
  });

  const mutation = useMutation({
    mutationFn: (values: LoginInput) =>
      webFetch<AuthLoginResponse>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(values),
      }),
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: ["session"] });
      toast.success(`Welcome back, ${result.data.user.displayName}`);
      router.replace("/dashboard");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  return (
    <AuthPageFrame
      eyebrow="Session access"
      title="Sign in to the starter"
      body="Use the seeded development accounts or your own registered user."
      footer={
        <p className="text-sm text-neutral-500">
          No account yet?{" "}
          <Link
            href="/register"
            className="text-neutral-950 underline dark:text-white"
          >
            Register
          </Link>
        </p>
      }
    >
      <form
        className="space-y-4"
        onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
      >
        <div>
          <label className="mb-2 block text-sm font-medium">Email</label>
          <Input {...form.register("email")} />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium">Password</label>
          <Input type="password" {...form.register("password")} />
        </div>
        <Button className="w-full" type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? "Signing in..." : "Sign in"}
        </Button>
      </form>
      <div className="mt-4 flex justify-between text-sm text-neutral-500">
        <Link href="/forgot-password">Forgot password?</Link>
        <Link href="/">Back home</Link>
      </div>
    </AuthPageFrame>
  );
}

function AuthPageFrame({
  body,
  children,
  eyebrow,
  footer,
  title,
}: {
  body: string;
  children: React.ReactNode;
  eyebrow: string;
  footer?: React.ReactNode;
  title: string;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_left,_rgba(251,191,36,0.22),transparent_26%),linear-gradient(180deg,#f4f1ea_0%,#e7dfd4_60%,#dfd6ca_100%)] px-6 py-8 dark:bg-[radial-gradient(circle_at_top_left,_rgba(251,191,36,0.14),transparent_22%),linear-gradient(180deg,#111111_0%,#171717_48%,#090909_100%)]">
      <Card className="w-full max-w-lg">
        <p className="text-xs uppercase tracking-[0.32em] text-neutral-500">
          {eyebrow}
        </p>
        <h1 className="mt-4 text-4xl font-semibold">{title}</h1>
        <p className="mt-3 text-sm leading-7 text-neutral-600 dark:text-neutral-300">
          {body}
        </p>
        <div className="mt-8">{children}</div>
        {footer ? <div className="mt-6">{footer}</div> : null}
      </Card>
    </div>
  );
}
