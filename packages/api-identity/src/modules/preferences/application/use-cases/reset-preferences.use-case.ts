import type { RequestContext } from '@repo/api-core';

import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import {
  AppError,
  AUDIT_WRITER,
  type AuditWriter,
  ERROR_CODES,
} from '@repo/api-core';

import { PreferencesRepository } from '../../infrastructure/preferences.repository';
import { PreferencesMapper } from '../preferences.mapper';

@Injectable()
export class ResetPreferencesUseCase {
  private readonly preferencesMapper = new PreferencesMapper();

  constructor(
    private readonly preferencesRepository: PreferencesRepository,
    @Inject(AUDIT_WRITER) private readonly auditWriter: AuditWriter,
  ) {}

  async execute(userId: string, requestContext?: RequestContext) {
    const reset = await this.preferencesRepository.reset(userId);

    if (!reset) {
      throw new AppError(
        ERROR_CODES.INTERNAL_ERROR,
        'Failed to reset user preferences',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    await this.auditWriter.log({
      actorId: userId,
      action: 'user.preferences.reset',
      entityType: 'user_preferences',
      entityId: userId,
      requestContext,
    });

    return this.preferencesMapper.toDto(reset);
  }
}
