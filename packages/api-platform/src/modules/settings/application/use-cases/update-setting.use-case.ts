import type {
  AuthenticatedRequestUser,
  RequestContext,
} from '@repo/api-core';

import { HttpStatus, Injectable } from '@nestjs/common';
import { AppError, ERROR_CODES } from '@repo/api-core';

import type { UpdateSettingCommand } from '../settings.types';

import { AuditService } from '../../../audit/application/audit.service';
import { SettingsRepository } from '../../infrastructure/settings.repository';
import { SettingsMapper } from '../settings.mapper';

@Injectable()
export class UpdateSettingUseCase {
  constructor(
    private readonly settingsRepository: SettingsRepository,
    private readonly auditService: AuditService,
  ) {}

  async execute(
    actor: AuthenticatedRequestUser,
    key: string,
    input: UpdateSettingCommand,
    requestContext?: RequestContext,
  ) {
    const updated = await this.settingsRepository.upsert(
      key,
      input.value,
      actor.userId,
    );

    if (!updated) {
      throw new AppError(
        ERROR_CODES.SETTINGS_NOT_FOUND,
        'Setting could not be updated',
        HttpStatus.NOT_FOUND,
      );
    }

    await this.auditService.log({
      actorId: actor.userId,
      action: 'settings.updated',
      entityType: 'application_setting',
      entityId: key,
      metadata: { key },
      requestContext,
    });

    return SettingsMapper.toDto(updated);
  }
}
