import type { UseFormReturn } from "react-hook-form";

import { Input } from "@repo/web-ui/input";
import { Label } from "@repo/web-ui/label";
import { LoadingButton } from "@repo/web-ui/loading-button";
import { Show } from "@repo/web-ui/show";
import { CheckCircle2 } from "lucide-react";

import type { ProfileForm } from "@/features/users/model/users.schemas";
import type { UserDetailViewModel } from "@/features/users/model/users.types";

interface UserDetailProfileProps {
  profile: UserDetailViewModel["profile"];
  canEdit: boolean;
}

export function UserDetailProfile({ profile, canEdit }: UserDetailProfileProps) {
  const form = profile.form as UseFormReturn<ProfileForm>;
  return (
    <div>
      <h4 className="mb-3 text-sm font-medium">Profile</h4>
      <form className="grid gap-4 sm:grid-cols-2" onSubmit={profile.onSubmit}>
        <div className="space-y-1.5">
          <Label htmlFor="p-name">Display name</Label>
          <Input id="p-name" {...form.register("displayName")} disabled={!canEdit} />
          {form.formState.errors.displayName && (
            <p className="text-xs text-destructive">{form.formState.errors.displayName.message}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="p-email">Email</Label>
          <Input id="p-email" type="email" {...form.register("email")} disabled={!canEdit} />
          {form.formState.errors.email && (
            <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
          )}
        </div>
        <div className="flex items-center gap-3 sm:col-span-2">
          <LoadingButton
            type="submit"
            loading={profile.state.isPending}
            disabled={!canEdit || (!form.formState.isDirty && !profile.state.isError)}
          >
            Save profile
          </LoadingButton>
          {profile.state.isSuccess && (
            <span className="flex items-center gap-1 text-xs text-primary">
              <CheckCircle2 className="size-3" /> Saved
            </span>
          )}
          <Show when={profile.state.isError}>
            <span className="text-xs text-destructive">Save failed.</span>
          </Show>
        </div>
      </form>
    </div>
  );
}
