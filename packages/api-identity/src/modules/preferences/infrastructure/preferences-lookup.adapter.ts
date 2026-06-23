import type {
  NotificationChannelPreferences,
  UserPreferencesLookup,
} from '@repo/api-core';

import { Injectable } from '@nestjs/common';

import { UsersRepository } from '../../users/infrastructure/users.repository';
import { DEFAULT_USER_PREFERENCES } from '../application/preferences.constants';
import { PreferencesRepository } from './preferences.repository';

function resolveNotificationPreferences(
  value: Record<string, unknown> | null | undefined,
): NotificationChannelPreferences {
  return {
    email: value?.email !== false,
    push: value?.push !== false,
  };
}

@Injectable()
export class PreferencesLookupAdapter implements UserPreferencesLookup {
  constructor(
    private readonly preferencesRepository: PreferencesRepository,
    private readonly usersRepository: UsersRepository,
  ) {}

  async findNotificationPreferencesByUserId(
    userId: string,
  ): Promise<NotificationChannelPreferences> {
    const preferences = await this.preferencesRepository.findByUserId(userId);

    return resolveNotificationPreferences(
      preferences?.notificationPreferences ??
        DEFAULT_USER_PREFERENCES.notificationPreferences,
    );
  }

  async findNotificationPreferencesByEmail(
    email: string,
  ): Promise<NotificationChannelPreferences | null> {
    const user = await this.usersRepository.findByEmail(email);

    if (!user) {
      return null;
    }

    return this.findNotificationPreferencesByUserId(user.id);
  }
}
