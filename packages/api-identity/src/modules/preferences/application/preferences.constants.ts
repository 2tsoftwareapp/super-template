export const PREFERENCE_THEMES = ["system", "light", "dark"] as const;
export const PREFERENCE_LANGUAGES = ["en", "vi"] as const;

export const DEFAULT_USER_PREFERENCES = {
  theme: "system" as (typeof PREFERENCE_THEMES)[number],
  language: "en" as (typeof PREFERENCE_LANGUAGES)[number],
  timezone: "UTC",
  notificationPreferences: {
    email: true,
    push: true,
  },
  emailPreferences: {},
};

export type PreferenceTheme = (typeof PREFERENCE_THEMES)[number];
export type PreferenceLanguage = (typeof PREFERENCE_LANGUAGES)[number];
