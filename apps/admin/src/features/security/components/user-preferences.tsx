"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/web-core/components/card";
import { Label } from "@repo/web-core/components/label";
import { Check, Globe, Laptop, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { type Locale, useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function UserPreferences() {
  const { theme, setTheme } = useTheme();
  const { locale, setLocale, t } = useI18n();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("preferences.title")}</CardTitle>
        <CardDescription>{t("preferences.description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Theme Settings */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">{t("preferences.theme")}</Label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: "light", label: t("preferences.themeLight"), icon: Sun },
              { id: "dark", label: t("preferences.themeDark"), icon: Moon },
              { id: "system", label: "System", icon: Laptop },
            ].map((option) => {
              const Icon = option.icon;
              const active = theme === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setTheme(option.id)}
                  className={cn(
                    "flex flex-col items-center gap-2 rounded-lg border border-input bg-popover p-3 text-center transition-all hover:bg-accent hover:text-accent-foreground",
                    active && "border-2 border-primary ring-1 ring-primary",
                  )}
                >
                  <Icon className={cn("size-5", active && "text-primary")} />
                  <span className="text-xs font-medium">{option.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Language Settings */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">
            {t("preferences.language")}
          </Label>
          <div className="grid grid-cols-2 gap-2">
            {[
              {
                id: "en" as Locale,
                label: t("preferences.languageEn"),
                code: "EN",
              },
              {
                id: "vi" as Locale,
                label: t("preferences.languageVi"),
                code: "VI",
              },
            ].map((option) => {
              const active = locale === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setLocale(option.id)}
                  className={cn(
                    "flex items-center justify-between rounded-lg border border-input bg-popover p-3 transition-all hover:bg-accent hover:text-accent-foreground",
                    active && "border-2 border-primary ring-1 ring-primary",
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Globe
                      className={cn(
                        "size-4 text-muted-foreground",
                        active && "text-primary",
                      )}
                    />
                    <span className="text-xs font-medium">{option.label}</span>
                  </div>
                  {active && <Check className="size-4 text-primary shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
