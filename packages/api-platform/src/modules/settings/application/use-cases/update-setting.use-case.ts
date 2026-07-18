import type {
  AuthenticatedRequestUser,
  RequestContext,
} from '@repo/api-core';

import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import {  AppError, ERROR_CODES, ROLE_NAMES , SYSTEM_SCOPE } from '@repo/api-core';

import type { UpdateSettingCommand } from '../settings.types';

import { AuditService } from '../../../audit/application/audit.service';
import { SETTINGS_REPOSITORY, type SettingsRepositoryPort } from '../ports/settings.repository.port';
import { SettingsMapper } from '../settings.mapper';

@Injectable()
export class UpdateSettingUseCase {
  constructor(
    @Inject(SETTINGS_REPOSITORY) private readonly settingsRepository: SettingsRepositoryPort,
    private readonly auditService: AuditService,
  ) {}

  async execute(
    actor: AuthenticatedRequestUser,
    key: string,
    input: UpdateSettingCommand,
    requestContext?: RequestContext,
  ) {
    if (!actor.roles.includes(ROLE_NAMES.SUPER_ADMIN)) {
      throw new AppError(
        ERROR_CODES.AUTH_FORBIDDEN,
        'Only SUPER_ADMIN can update application settings',
        HttpStatus.FORBIDDEN,
      );
    }

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
        scope: SYSTEM_SCOPE.PLATFORM
    });

    return SettingsMapper.toDto(updated);
  }
}
