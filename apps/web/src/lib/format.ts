import type { PreferenceLanguage } from "@/lib/preferences";

const localeByLanguage: Record<PreferenceLanguage, string> = {
  en: "en-US",
  vi: "vi-VN",
};

export function formatDateTime(
  dateStr: string | undefined | null,
  options?: {
    timezone?: string;
    language?: PreferenceLanguage;
  },
): string {
  if (!dateStr) {
    return "—";
  }

  const date = new Date(dateStr);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  const locale = localeByLanguage[options?.language ?? "en"];

  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
    ...(options?.timezone ? { timeZone: options.timezone } : {}),
  }).format(date);
}
