import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "vi"],
  defaultLocale: "en",
  // Always prefix so /en/users and /vi/users are canonical, shareable URLs.
  localePrefix: "always",
});

export type AppLocale = (typeof routing.locales)[number];
