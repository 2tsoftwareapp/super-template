"use client";

import { Button } from "@repo/web-core/components/button";
import { Dropdown } from "@repo/web-core/components/dropdown";
import { Check, Languages } from "lucide-react";

import { useI18n } from "@/lib/i18n";

export function LanguageSwitcher() {
  const { locale, setLocale } = useI18n();

  return (
    <Dropdown
      align="end"
      trigger={
        <Button
          variant="ghost"
          size="icon"
          aria-label="Change language"
          className="size-8 text-muted-foreground hover:text-foreground hover:scale-105 transition-all"
        >
          <Languages className="size-4" />
        </Button>
      }
      items={[
        {
          label: "English",
          icon:
            locale === "en" ? (
              <Check className="size-3.5 text-primary" />
            ) : (
              <span className="size-3.5" />
            ),
          onClick: () => setLocale("en"),
        },
        {
          label: "Tiếng Việt",
          icon:
            locale === "vi" ? (
              <Check className="size-3.5 text-primary" />
            ) : (
              <span className="size-3.5" />
            ),
          onClick: () => setLocale("vi"),
        },
      ]}
    />
  );
}
