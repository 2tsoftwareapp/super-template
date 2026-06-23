import type { JsonObject } from '@repo/api-core';

import type {
  PreferenceLanguage,
  PreferenceTheme,
} from './preferences.constants';

export interface UpdatePreferencesCommand {
  theme?: PreferenceTheme;
  language?: PreferenceLanguage;
  timezone?: string;
  notificationPreferences?: JsonObject;
  emailPreferences?: JsonObject;
}
