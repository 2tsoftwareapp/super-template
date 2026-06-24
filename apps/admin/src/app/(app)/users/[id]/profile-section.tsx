"use client";

import { standardSchemaResolver as zodResolver } from "@hookform/resolvers/standard-schema";
import { CheckCircle2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import type { AdminUserDto, UpdateAdminUserInput } from "@/lib/api-types";

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
import { Spinner } from "@/components/ui/spinner";

const profileSchema = z.object({
  email: z.email(),
  displayName: z.string().min(2),
});
type ProfileForm = z.infer<typeof profileSchema>;

export function ProfileSection({
  user,
  canEdit,
  onSave,
  isSaving,
  saveError,
  saveSuccess,
}: {
  user: AdminUserDto;
  canEdit: boolean;
  onSave: (input: UpdateAdminUserInput) => Promise<void>;
  isSaving: boolean;
  saveError: boolean;
  saveSuccess: boolean;
}) {
  const form = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    values: {
      email: user.email ?? "",
      displayName: user.displayName ?? "",
    },
  });

  const isDirty = form.formState.isDirty;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
        <CardDescription>
          Core account details.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="grid gap-4 sm:grid-cols-2"
          onSubmit={form.handleSubmit((values) => {
            void onSave(values);
          })}
        >
          <div className="space-y-1.5">
            <Label htmlFor="p-name">Display name</Label>
            <Input
              id="p-name"
              {...form.register("displayName")}
              disabled={!canEdit}
            />
            {form.formState.errors.displayName && (
              <p className="text-xs text-destructive">
                {form.formState.errors.displayName.message}
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="p-email">Email</Label>
            <Input
              id="p-email"
              type="email"
              {...form.register("email")}
              disabled={!canEdit}
            />
            {form.formState.errors.email && (
              <p className="text-xs text-destructive">
                {form.formState.errors.email.message}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3 sm:col-span-2">
            <Button
              type="submit"
              disabled={isSaving || !canEdit || (!isDirty && !saveError)}
            >
              {isSaving ? (
                <>
                  <Spinner className="size-4" /> Saving…
                </>
              ) : (
                "Save profile"
              )}
            </Button>
            {saveSuccess && (
              <span className="flex items-center gap-1 text-xs text-emerald-600">
                <CheckCircle2 className="size-3" /> Saved
              </span>
            )}
            {saveError && (
              <span className="flex items-center gap-1 text-xs text-destructive">
                Save failed.
              </span>
            )}
          </div>
        </form>
        <p className="mt-3 text-[11px] text-muted-foreground">
          Last updated {user.updatedAt ? new Date(user.updatedAt).toLocaleString() : "—"}
        </p>
      </CardContent>
    </Card>
  );
}
