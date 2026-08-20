"use client";

import { standardSchemaResolver as zodResolver } from "@hookform/resolvers/standard-schema";
import { ErrorState } from "@repo/web-ui/error-state";
import { Input } from "@repo/web-ui/input";
import { Label } from "@repo/web-ui/label";
import { LoadingButton } from "@repo/web-ui/loading-button";
import { Show } from "@repo/web-ui/show";
import { Textarea } from "@repo/web-ui/textarea";
import { useForm, useWatch } from "react-hook-form";

import {
  type NotificationComposeFormValues,
  notificationComposeSchema,
} from "../model/notifications.schemas";

export function NotificationComposeForm({
  isSending,
  isError,
  onSubmit,
}: {
  isSending: boolean;
  isError: boolean;
  onSubmit: (values: NotificationComposeFormValues) => void;
}) {
  const form = useForm<NotificationComposeFormValues>({
    resolver: zodResolver(notificationComposeSchema),
    defaultValues: {
      audience: "ALL",
      userId: "",
      userIds: "",
      type: "SYSTEM",
      title: "Test notification",
      body: "This is a test notification sent from the admin panel.",
    },
  });

  const audience = useWatch<NotificationComposeFormValues, "audience">({
    control: form.control,
    name: "audience",
  });

  const handleSubmit = form.handleSubmit((values) => {
    onSubmit(values);
  });

  return (
    <form id="notif-compose-form" className="space-y-4" onSubmit={handleSubmit}>
      <Show when={isError}>
        <ErrorState
          variant="inline"
          title="Failed to queue notification."
          action={{ label: "Retry", onClick: () => onSubmit(form.getValues()) }}
        />
      </Show>

      <div className="space-y-1.5">
        <Label htmlFor="notif-audience">Audience</Label>
        <select
          id="notif-audience"
          className="flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm shadow-xs outline-hidden transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          {...form.register("audience")}
        >
          <option value="ALL">All users</option>
          <option value="USER">Single user</option>
          <option value="USERS">Multiple users</option>
        </select>
      </div>

      {audience === "USER" ? (
        <div className="space-y-1.5">
          <Label htmlFor="notif-user-id">User ID</Label>
          <Input
            id="notif-user-id"
            placeholder="uuid of the target user"
            aria-invalid={Boolean(form.formState.errors.userId)}
            {...form.register("userId")}
          />
          {form.formState.errors.userId ? (
            <p className="text-xs text-destructive">{form.formState.errors.userId.message}</p>
          ) : null}
        </div>
      ) : null}

      {audience === "USERS" ? (
        <div className="space-y-1.5">
          <Label htmlFor="notif-user-ids">User IDs</Label>
          <Textarea
            id="notif-user-ids"
            placeholder="One UUID per line, or comma-separated"
            className="min-h-[60px]"
            aria-invalid={Boolean(form.formState.errors.userIds)}
            {...form.register("userIds")}
          />
          {form.formState.errors.userIds ? (
            <p className="text-xs text-destructive">{form.formState.errors.userIds.message}</p>
          ) : null}
        </div>
      ) : null}

      <div className="space-y-1.5">
        <Label htmlFor="notif-type">Type</Label>
        <Input
          id="notif-type"
          aria-invalid={Boolean(form.formState.errors.type)}
          {...form.register("type")}
        />
        {form.formState.errors.type ? (
          <p className="text-xs text-destructive">{form.formState.errors.type.message}</p>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="notif-title">Title</Label>
        <Input
          id="notif-title"
          placeholder="Test notification"
          aria-invalid={Boolean(form.formState.errors.title)}
          {...form.register("title")}
        />
        {form.formState.errors.title ? (
          <p className="text-xs text-destructive">{form.formState.errors.title.message}</p>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="notif-body">Body</Label>
        <Textarea
          id="notif-body"
          placeholder="This is a test notification sent from the admin panel."
          className="min-h-[80px]"
          aria-invalid={Boolean(form.formState.errors.body)}
          {...form.register("body")}
        />
        {form.formState.errors.body ? (
          <p className="text-xs text-destructive">{form.formState.errors.body.message}</p>
        ) : null}
      </div>

      <LoadingButton type="submit" className="w-full" loading={isSending}>
        Send test notification
      </LoadingButton>
    </form>
  );
}
