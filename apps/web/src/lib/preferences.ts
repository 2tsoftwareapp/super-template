export const preferenceThemes = ['system', 'light', 'dark'] as const;
export const preferenceLanguages = ['en', 'vi'] as const;

export const preferredTimezones = [
  'UTC',
  'Asia/Ho_Chi_Minh',
  'Asia/Singapore',
  'America/New_York',
  'America/Los_Angeles',
  'Europe/London',
] as const;

export type PreferenceTheme = (typeof preferenceThemes)[number];
export type PreferenceLanguage = (typeof preferenceLanguages)[number];
