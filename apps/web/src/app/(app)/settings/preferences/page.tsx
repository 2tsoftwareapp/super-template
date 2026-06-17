"use client";

import { standardSchemaResolver as zodResolver } from "@hookform/resolvers/standard-schema";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import type { ApiEnvelope } from "@/lib/api-types";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { webFetch } from "@/lib/http";

interface Preferences {
  theme: string;
  language: string;
  timezone: string;
  notificationPreferences: Record<string, unknown>;
  emailPreferences: Record<string, unknown>;
}

const schema = z.object({
  theme: z.enum(["system", "light", "dark"]),
  language: z.string().min(2).max(10),
  timezone: z.string().min(1).max(64),
  emailEnabled: z.boolean(),
  pushEnabled: z.boolean(),
});

type PreferencesFormValues = z.infer<typeof schema>;

export default function PreferencesSettingsPage() {
  const queryClient = useQueryClient();
  const preferences = useQuery({
    queryKey: ["preferences"],
    queryFn: () =>
      webFetch<ApiEnvelope<Preferences>>("/api/bff/users/me/preferences"),
  });

  const form = useForm<PreferencesFormValues>({
    resolver: zodResolver(schema),
    values: {
      theme:
        (preferences.data?.data.theme as PreferencesFormValues["theme"]) ??
        "system",
      language: preferences.data?.data.language ?? "en",
      timezone: preferences.data?.data.timezone ?? "UTC",
      emailEnabled:
        (preferences.data?.data.notificationPreferences?.email as boolean) ??
        true,
      pushEnabled:
        (preferences.data?.data.notificationPreferences?.push as boolean) ??
        true,
    },
  });
  const theme = useWatch({ control: form.control, name: "theme" });
  const emailEnabled = useWatch({
    control: form.control,
    name: "emailEnabled",
  });
  const pushEnabled = useWatch({
    control: form.control,
    name: "pushEnabled",
  });

  const mutation = useMutation({
    mutationFn: (values: PreferencesFormValues) =>
      webFetch("/api/bff/users/me/preferences", {
        method: "PATCH",
        body: JSON.stringify({
          theme: values.theme,
          language: values.language,
          timezone: values.timezone,
          notificationPreferences: {
            email: values.emailEnabled,
            push: values.pushEnabled,
          },
        }),
      }),
    onSuccess: () => {
      toast.success("Preferences updated");
      void queryClient.invalidateQueries({ queryKey: ["preferences"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <div className="max-w-3xl space-y-6">
      <SettingsNav />
      <Card className="border-border">
        <CardHeader className="space-y-3">
          <Badge variant="outline" className="w-fit">
            Preferences
          </Badge>
          <CardTitle className="text-4xl">Preferences</CardTitle>
          <CardDescription>
            Theme, language, timezone, and notification preferences.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-4"
            onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
          >
            <div className="space-y-2">
              <Label>Theme</Label>
              <Select
                value={theme}
                onValueChange={(value) =>
                  form.setValue(
                    "theme",
                    value!,
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="system">System</SelectItem>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="language">Language</Label>
              <Input id="language" {...form.register("language")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Input id="timezone" {...form.register("timezone")} />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="emailEnabled">Email notifications</Label>
              <Switch
                id="emailEnabled"
                checked={emailEnabled}
                onCheckedChange={(checked) =>
                  form.setValue("emailEnabled", checked)
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="pushEnabled">Push notifications</Label>
              <Switch
                id="pushEnabled"
                checked={pushEnabled}
                onCheckedChange={(checked) =>
                  form.setValue("pushEnabled", checked)
                }
              />
            </div>
            <Button type="submit" disabled={mutation.isPending}>
              Save preferences
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
