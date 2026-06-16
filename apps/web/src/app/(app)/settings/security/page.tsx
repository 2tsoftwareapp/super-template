"use client";

import { standardSchemaResolver as zodResolver } from "@hookform/resolvers/standard-schema";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
    <Card className="max-w-3xl border-border">
      <CardHeader className="space-y-3">
        <Badge variant="outline" className="w-fit">
          Security
        </Badge>
        <CardTitle className="text-4xl">Security</CardTitle>
        <CardDescription>
          Rotate the current password for the active account.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-4"
          onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
        >
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Current password</Label>
            <Input
              id="currentPassword"
              type="password"
              placeholder="Current password"
              {...form.register("currentPassword")}
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
          <Button type="submit">Update password</Button>
        </form>
      </CardContent>
    </Card>
  );
}
