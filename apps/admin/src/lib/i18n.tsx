"use client";

import { useLocale, useTranslations } from "next-intl";
import { useParams } from "next/navigation";

import type { AppLocale } from "@/i18n/routing";

import { usePathname, useRouter } from "@/i18n/navigation";

export type Locale = AppLocale;

// Compat layer over next-intl: same useI18n() surface the app always had,
// but locale now lives in the URL ([locale] segment) instead of localStorage.
export function useI18n() {
  const locale = useLocale() as Locale;
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();

  const setLocale = (nextLocale: Locale) => {
    if (nextLocale === locale) return;
    // Re-render the current route under the new locale prefix.
    router.replace(
      // @ts-expect-error -- pathname+params matches the current route shape
      { pathname, params },
      { locale: nextLocale },
    );
  };

  return {
    locale,
    setLocale,
    t: (key: string) => t(key),
  };
}
