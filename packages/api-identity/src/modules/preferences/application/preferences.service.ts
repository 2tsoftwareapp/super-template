import type { RequestContext } from '@repo/api-core';

import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import {
  AppError,
  AUDIT_WRITER,
  type AuditWriter,
  ERROR_CODES,
} from '@repo/api-core';

import type { UpdatePreferencesCommand } from './preferences.types';

import { PreferencesRepository } from '../infrastructure/preferences.repository';

@Injectable()
export class PreferencesService {
  constructor(
    private readonly preferencesRepository: PreferencesRepository,
    @Inject(AUDIT_WRITER) private readonly auditWriter: AuditWriter,
  ) {}

  async getForUser(userId: string) {
    const preferences =
      (await this.preferencesRepository.findByUserId(userId)) ??
      (await this.preferencesRepository.upsert(userId, {}));

    if (!preferences) {
      throw new AppError(
        ERROR_CODES.INTERNAL_ERROR,
        'Failed to load user preferences',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    return this.toDto(preferences);
  }

  async updateForUser(
    userId: string,
    input: UpdatePreferencesCommand,
    requestContext?: RequestContext,
  ) {
    const updated = await this.preferencesRepository.upsert(userId, {
      ...(input.theme !== undefined ? { theme: input.theme } : {}),
      ...(input.language !== undefined ? { language: input.language } : {}),
      ...(input.timezone !== undefined ? { timezone: input.timezone } : {}),
      ...(input.notificationPreferences !== undefined
        ? { notificationPreferences: input.notificationPreferences }
        : {}),
      ...(input.emailPreferences !== undefined
        ? { emailPreferences: input.emailPreferences }
        : {}),
    });

    if (!updated) {
      throw new AppError(
        ERROR_CODES.INTERNAL_ERROR,
        'Failed to update user preferences',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    await this.auditWriter.log({
      actorId: userId,
      action: 'user.preferences.updated',
      entityType: 'user_preferences',
      entityId: userId,
      requestContext,
    });

    return this.toDto(updated);
  }

  private toDto(
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
