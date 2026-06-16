"use client";

import { standardSchemaResolver as zodResolver } from "@hookform/resolvers/standard-schema";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { ChangePasswordInput } from "@/lib/api-types";
import { webFetch } from "@/lib/http";

const schema = z.object({
  currentPassword: z.string().min(8),
  newPassword: z.string().min(8),
});

export default function SecuritySettingsPage() {
  const form = useForm<ChangePasswordInput>({
    resolver: zodResolver(schema),
  });

  const mutation = useMutation({
    mutationFn: (values: ChangePasswordInput) =>
      webFetch("/api/bff/users/me/password", {
        method: "PATCH",
        body: JSON.stringify(values),
      }),
    onSuccess: () =>
      toast.success("Password changed. Other sessions were revoked."),
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <Card className="max-w-3xl">
      <h1 className="text-4xl font-semibold">Security</h1>
      <form
        className="mt-8 space-y-4"
        onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
      >
        <Input
          type="password"
          placeholder="Current password"
          {...form.register("currentPassword")}
        />
        <Input
          type="password"
          placeholder="New password"
          {...form.register("newPassword")}
        />
        <Button type="submit">Update password</Button>
      </form>
    </Card>
  );
}
