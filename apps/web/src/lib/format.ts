import type { PreferenceLanguage } from "@/lib/preferences";

const localeByLanguage: Record<PreferenceLanguage, string> = {
  en: "en-US",
  vi: "vi-VN",
};

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0)} ${units[i]!}`;
}

export function timeAgo(dateStr: string | undefined | null): string {
  if (!dateStr) return "—";
  const diff = Date.now() - new Date(dateStr).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

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
