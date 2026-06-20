import type { PreferencesRepository } from '../infrastructure/preferences.repository';

export class PreferencesMapper {
  toDto(
    preferences: NonNullable<
      Awaited<ReturnType<PreferencesRepository['findByUserId']>>
    >,
  ) {
    return {
      userId: preferences.userId,
      theme: preferences.theme,
      language: preferences.language,
      timezone: preferences.timezone,
      notificationPreferences: preferences.notificationPreferences,
      emailPreferences: preferences.emailPreferences,
      createdAt: preferences.createdAt.toISOString(),
      updatedAt: preferences.updatedAt.toISOString(),
    };
  }
}
