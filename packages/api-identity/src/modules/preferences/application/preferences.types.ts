import type { JsonObject } from '@repo/api-core';
export interface UpdatePreferencesCommand {
  theme?: string;
  language?: string;
  timezone?: string;
  notificationPreferences?: JsonObject;
  emailPreferences?: JsonObject;
}
