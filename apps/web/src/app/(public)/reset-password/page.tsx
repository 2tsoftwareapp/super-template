"use client";

import { useEffect } from "react";
import { standardSchemaResolver as zodResolver } from "@hookform/resolvers/standard-schema";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
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
    <AuthShell
      eyebrow="Password recovery"
      title="Choose a new password"
      body="Paste the reset token from Mailpit and pick a new secret."
    >
      <Card className="border-0 bg-transparent shadow-none">
        <CardContent className="space-y-4 p-6">
          <form
            className="space-y-4"
            onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
          >
            <div className="space-y-2">
              <Label htmlFor="token">Reset token</Label>
              <Input
                id="token"
                placeholder="Reset token"
                {...form.register("token")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">New password</Label>
              <Input
                id="newPassword"
                type="password"
                placeholder="New password"
                {...form.register("newPassword")}
              />
            </div>
            <Button className="w-full" type="submit">
              Reset password
            </Button>
          </form>
        </CardContent>
      </Card>
    </AuthShell>
  );
}
