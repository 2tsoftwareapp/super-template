"use client";

import { standardSchemaResolver as zodResolver } from "@hookform/resolvers/standard-schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { FileUpload } from "@/components/app/file-upload";
import { SettingsNav } from "@/components/app/settings-nav";
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
import { useSession } from "@/hooks/use-session";
import { webFetch } from "@/lib/http";

const schema = z.object({
  displayName: z.string().min(2).max(120).optional(),
  avatarUrl: z.string().url().optional().or(z.literal("")),
});

type ProfileFormValues = z.infer<typeof schema>;

export default function ProfileSettingsPage() {
  const session = useSession();
  const queryClient = useQueryClient();
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
    mutationFn: (values: ProfileFormValues & { avatarFileId?: string }) =>
      webFetch("/api/bff/users/me", {
        method: "PATCH",
        body: JSON.stringify({
          displayName: values.displayName,
          avatarUrl: values.avatarUrl === "" ? undefined : values.avatarUrl,
          avatarFileId: values.avatarFileId,
        }),
      }),
    onSuccess: () => {
      toast.success("Profile updated");
      void queryClient.invalidateQueries({ queryKey: ["session"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <div className="max-w-3xl space-y-6">
      <SettingsNav />
      <Card className="border-border">
        <CardHeader className="space-y-3">
          <Badge variant="outline" className="w-fit">
            Profile
          </Badge>
          <CardTitle className="text-4xl">Profile</CardTitle>
          <CardDescription>Update display name and avatar.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <FileUpload
            accept="image/*"
            label="Upload avatar"
            onUploaded={(file) =>
              mutation.mutate({
                displayName: form.getValues("displayName"),
                avatarUrl: form.getValues("avatarUrl"),
                avatarFileId: file.id,
              })
            }
          />
          <form
            className="space-y-4"
            onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
          >
            <div className="space-y-2">
              <Label htmlFor="displayName">Display name</Label>
              <Input id="displayName" {...form.register("displayName")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="avatarUrl">Avatar URL (optional fallback)</Label>
              <Input
                id="avatarUrl"
                placeholder="https://..."
                {...form.register("avatarUrl")}
              />
            </div>
            <Button type="submit">Save profile</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
