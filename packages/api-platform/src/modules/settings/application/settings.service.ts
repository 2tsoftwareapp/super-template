import type {
  AuthenticatedRequestUser,
  RequestContext,
} from '@repo/api-core';
import type { DatabaseExecutor } from '@repo/api-database';

import { HttpStatus, Injectable } from '@nestjs/common';
import { ERROR_CODES } from '@repo/api-core';
import { AppError } from '@repo/api-core';

import type { UpdateSettingCommand } from './settings.types';

import { AuditService } from '../../audit/application/audit.service';
import { SettingsRepository } from '../infrastructure/settings.repository';

@Injectable()
export class SettingsService {
  constructor(
    private readonly settingsRepository: SettingsRepository,
    private readonly auditService: AuditService,
  ) {}

  async ensureSeedData(executor?: DatabaseExecutor) {
    await this.settingsRepository.ensureDefaults(
      [
        {
          key: 'registration_enabled',
          value: { enabled: true },
        },
        {
          key: 'maintenance_mode',
          value: { enabled: false, message: null },
        },
      ],
      executor,
    );
  }

  async listAll() {
    const settings = await this.settingsRepository.findAll();

    return settings.map((setting) => this.toDto(setting));
  }

  async updateByKey(
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

    return this.toDto(updated);
  }

  private toDto(
    setting: Awaited<
      ReturnType<SettingsRepository['findByKey']>
    > extends infer T
      ? Exclude<T, null>
      : never,
  ) {
    return {
      key: setting.key,
      value: setting.value,
      updatedById: setting.updatedById ?? null,
      createdAt: setting.createdAt.toISOString(),
      updatedAt: setting.updatedAt.toISOString(),
    };
  }
}
