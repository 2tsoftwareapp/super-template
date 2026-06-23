"use client";

import { standardSchemaResolver as zodResolver } from "@hookform/resolvers/standard-schema";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTheme } from "next-themes";
import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import type { ApiEnvelope } from "@/lib/api-types";
import type { JsonObject } from "@/lib/json";

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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useI18n } from "@/lib/i18n/context";
import { webFetch } from "@/lib/http";
import {
  preferenceLanguages,
  preferredTimezones,
  preferenceThemes,
  type PreferenceLanguage,
  type PreferenceTheme,
} from "@/lib/preferences";

interface Preferences {
  theme: PreferenceTheme;
  language: PreferenceLanguage;
  timezone: string;
  notificationPreferences: JsonObject;
  emailPreferences: JsonObject;
}

const schema = z.object({
  theme: z.enum(preferenceThemes),
  language: z.enum(preferenceLanguages),
  timezone: z.enum(preferredTimezones),
  emailEnabled: z.boolean(),
  pushEnabled: z.boolean(),
});

type PreferencesFormValues = z.infer<typeof schema>;

export default function PreferencesSettingsPage() {
  const queryClient = useQueryClient();
  const { setTheme } = useTheme();
  const { t } = useI18n();
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
      timezone:
        (preferences.data?.data.timezone as PreferencesFormValues["timezone"]) ??
        "UTC",
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

  useEffect(() => {
    if (theme) {
      setTheme(theme);
    }
  }, [setTheme, theme]);

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
      toast.success(t("preferences.saved"));
      void queryClient.invalidateQueries({ queryKey: ["preferences"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const resetMutation = useMutation({
    mutationFn: () =>
      webFetch<ApiEnvelope<Preferences>>("/api/bff/users/me/preferences", {
        method: "DELETE",
      }),
    onSuccess: (result) => {
      form.reset({
        theme: result.data.theme,
        language: result.data.language,
        timezone: result.data.timezone as PreferencesFormValues["timezone"],
        emailEnabled:
          (result.data.notificationPreferences?.email as boolean) ?? true,
        pushEnabled:
          (result.data.notificationPreferences?.push as boolean) ?? true,
      });
      toast.success(t("preferences.resetDone"));
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
            {t("preferences.badge")}
          </Badge>
          <CardTitle className="text-4xl">{t("preferences.title")}</CardTitle>
          <CardDescription>
            {t("preferences.description")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-4"
            onSubmit={form.handleSubmit((values: PreferencesFormValues) =>
              mutation.mutate(values),
            )}
          >
            <div className="space-y-2">
              <Label>{t("preferences.theme")}</Label>
              <Select
                value={theme}
                onValueChange={(value) => form.setValue("theme", value!)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="system">{t("preferences.themeSystem")}</SelectItem>
                  <SelectItem value="light">{t("preferences.themeLight")}</SelectItem>
                  <SelectItem value="dark">{t("preferences.themeDark")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="language">{t("preferences.language")}</Label>
              <Select
                value={form.watch("language")}
                onValueChange={(value) =>
                  form.setValue("language", value as PreferencesFormValues["language"])
                }
              >
                <SelectTrigger id="language">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">{t("preferences.languageEn")}</SelectItem>
                  <SelectItem value="vi">{t("preferences.languageVi")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="timezone">{t("preferences.timezone")}</Label>
              <Select
                value={form.watch("timezone")}
                onValueChange={(value) =>
                  form.setValue("timezone", value as PreferencesFormValues["timezone"])
                }
              >
                <SelectTrigger id="timezone">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {preferredTimezones.map((timezoneOption) => (
                    <SelectItem key={timezoneOption} value={timezoneOption}>
                      {timezoneOption}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="emailEnabled">{t("preferences.emailNotifications")}</Label>
              <Switch
                id="emailEnabled"
                checked={emailEnabled}
                onCheckedChange={(checked) =>
                  form.setValue("emailEnabled", checked)
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="pushEnabled">{t("preferences.pushNotifications")}</Label>
              <Switch
                id="pushEnabled"
                checked={pushEnabled}
                onCheckedChange={(checked) =>
                  form.setValue("pushEnabled", checked)
                }
              />
            </div>
            <div className="flex gap-3">
              <Button type="submit" disabled={mutation.isPending}>
                {t("preferences.save")}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={resetMutation.isPending}
                onClick={() => resetMutation.mutate()}
              >
                {t("preferences.reset")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
