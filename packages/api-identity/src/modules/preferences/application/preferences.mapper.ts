import { Injectable } from '@nestjs/common';

import type { UserPreferencesRecord } from './ports/preferences.repository.port';

@Injectable()
export class PreferencesMapper {
  toDto(preferences: UserPreferencesRecord) {
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
