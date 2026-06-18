export interface UpdatePreferencesCommand {
  theme?: string;
  language?: string;
  timezone?: string;
  notificationPreferences?: Record<string, unknown>;
  emailPreferences?: Record<string, unknown>;
}
