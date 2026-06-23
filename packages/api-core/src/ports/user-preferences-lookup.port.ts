export interface NotificationChannelPreferences {
  email: boolean;
  push: boolean;
}

export interface UserPreferencesLookup {
  findNotificationPreferencesByUserId(
    userId: string,
  ): Promise<NotificationChannelPreferences>;
  findNotificationPreferencesByEmail(
    email: string,
  ): Promise<NotificationChannelPreferences | null>;
}

export const USER_PREFERENCES_LOOKUP = Symbol('USER_PREFERENCES_LOOKUP');
