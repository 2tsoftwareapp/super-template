import type {
  NotificationChannelPreferences,
  UserPreferencesLookup,
} from '@repo/api-core';

import { Inject, Injectable } from '@nestjs/common';

import { USERS_REPOSITORY, type UsersRepositoryPort } from '../../users/application/ports/users.repository.port';
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
    @Inject(USERS_REPOSITORY) private readonly usersRepository: UsersRepositoryPort,
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
