export interface NotificationChannelPreferences {
  email: boolean;
  push: boolean;
}

export interface UserPreferencesLookup {
  findNotificationPreferencesByUserId(userId: string): Promise<NotificationChannelPreferences>;
  findNotificationPreferencesByEmail(email: string): Promise<NotificationChannelPreferences | null>;
}

export { USER_PREFERENCES_LOOKUP } from "./user-preferences-lookup.token";
