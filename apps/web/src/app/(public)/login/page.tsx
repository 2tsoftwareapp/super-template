"use client";

import { standardSchemaResolver as zodResolver } from "@hookform/resolvers/standard-schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import type { AuthLoginResponse, LoginInput } from "@/lib/api-types";

import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { webFetch } from "@/lib/http";
import { getPostLoginPath } from "@/lib/navigation";

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
      router.replace(getPostLoginPath());
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  return (
    <AuthShell
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
      <Card className="border-0 bg-transparent shadow-none">
        <CardContent className="space-y-4 p-6">
          <form
            className="space-y-4"
            onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
          >
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" {...form.register("email")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                {...form.register("password")}
              />
            </div>
            <Button
              className="w-full"
              type="submit"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? "Signing in..." : "Sign in"}
            </Button>
          </form>
        </CardContent>
      </Card>
      <div className="flex justify-between text-sm text-muted-foreground">
        <Link href="/forgot-password">Forgot password?</Link>
        <Link href="/">Back home</Link>
      </div>
    </AuthShell>
  );
}
