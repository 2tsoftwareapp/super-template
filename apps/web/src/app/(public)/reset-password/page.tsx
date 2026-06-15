"use client";

import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { ResetPasswordInput } from "@/lib/api-types";
import { webFetch } from "@/lib/http";

const schema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(8),
});

export default function ResetPasswordPage() {
  const form = useForm<ResetPasswordInput>({
    resolver: zodResolver(schema),
    defaultValues: {
      token: "",
      newPassword: "",
    },
  });

  useEffect(() => {
    const token =
      new URLSearchParams(window.location.search).get("token") ?? "";
    form.setValue("token", token);
  }, [form]);

  const mutation = useMutation({
    mutationFn: (values: ResetPasswordInput) =>
      webFetch("/api/bff/auth/reset-password", {
        method: "POST",
        body: JSON.stringify(values),
      }),
    onSuccess: () => toast.success("Password reset complete"),
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-8">
      <Card className="w-full max-w-lg">
        <h1 className="text-3xl font-semibold">Choose a new password</h1>
        <form
          className="mt-8 space-y-4"
          onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
        >
          <Input placeholder="Reset token" {...form.register("token")} />
          <Input
            type="password"
            placeholder="New password"
            {...form.register("newPassword")}
          />
          <Button className="w-full" type="submit">
            Reset password
          </Button>
        </form>
      </Card>
    </div>
  );
}
