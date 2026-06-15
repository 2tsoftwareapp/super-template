"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { RegisterInput } from "@/lib/api-types";
import { webFetch } from "@/lib/http";

const schema = z.object({
  email: z.email(),
  password: z.string().min(8),
  displayName: z.string().min(2).max(120),
});

export default function RegisterPage() {
  const router = useRouter();
  const form = useForm<RegisterInput>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "",
      password: "",
      displayName: "",
    },
  });

  const mutation = useMutation({
    mutationFn: (values: RegisterInput) =>
      webFetch("/api/auth/register", {
        method: "POST",
        body: JSON.stringify(values),
      }),
    onSuccess: () => {
      toast.success("Registration submitted. Check Mailpit for verification.");
      router.replace("/login");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_left,_rgba(251,191,36,0.22),transparent_26%),linear-gradient(180deg,#f4f1ea_0%,#e7dfd4_60%,#dfd6ca_100%)] px-6 py-8 dark:bg-[radial-gradient(circle_at_top_left,_rgba(251,191,36,0.14),transparent_22%),linear-gradient(180deg,#111111_0%,#171717_48%,#090909_100%)]">
      <Card className="w-full max-w-lg">
        <p className="text-xs uppercase tracking-[0.32em] text-neutral-500">
          New account
        </p>
        <h1 className="mt-4 text-4xl font-semibold">Create a workspace user</h1>
        <form
          className="mt-8 space-y-4"
          onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
        >
          <div>
            <label className="mb-2 block text-sm font-medium">
              Display name
            </label>
            <Input {...form.register("displayName")} />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">Email</label>
            <Input {...form.register("email")} />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">Password</label>
            <Input type="password" {...form.register("password")} />
          </div>
          <Button
            className="w-full"
            type="submit"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "Creating account..." : "Register"}
          </Button>
        </form>
        <p className="mt-6 text-sm text-neutral-500">
          Already registered?{" "}
          <Link
            href="/login"
            className="text-neutral-950 underline dark:text-white"
          >
            Sign in
          </Link>
        </p>
      </Card>
    </div>
  );
}
