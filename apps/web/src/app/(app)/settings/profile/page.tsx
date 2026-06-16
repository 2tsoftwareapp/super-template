"use client";

import { standardSchemaResolver as zodResolver } from "@hookform/resolvers/standard-schema";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useSession } from "@/hooks/use-session";
import { webFetch } from "@/lib/http";

const schema = z.object({
  displayName: z.string().min(2).max(120).optional(),
  avatarUrl: z.string().url().optional().or(z.literal("")),
});

type ProfileFormValues = z.infer<typeof schema>;

export default function ProfileSettingsPage() {
  const session = useSession();
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(schema),
    values: {
      displayName: session.data?.data.user.displayName,
      avatarUrl:
        typeof session.data?.data.user.avatarUrl === "string"
          ? session.data.data.user.avatarUrl
          : undefined,
    },
  });

  const mutation = useMutation({
    mutationFn: (values: ProfileFormValues) =>
      webFetch("/api/bff/users/me", {
        method: "PATCH",
        body: JSON.stringify({
          displayName: values.displayName,
          avatarUrl: values.avatarUrl || undefined,
        }),
      }),
    onSuccess: () => toast.success("Profile updated"),
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <Card className="max-w-3xl">
      <h1 className="text-4xl font-semibold">Profile</h1>
      <form
        className="mt-8 space-y-4"
        onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
      >
        <Input {...form.register("displayName")} />
        <Input placeholder="Avatar URL" {...form.register("avatarUrl")} />
        <Button type="submit">Save profile</Button>
      </form>
    </Card>
  );
}
