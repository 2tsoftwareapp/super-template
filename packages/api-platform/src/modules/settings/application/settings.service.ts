import type {
  AuthenticatedRequestUser,
  RequestContext,
} from '@repo/api-core';
import type { DatabaseExecutor } from '@repo/api-database';

import { Injectable } from '@nestjs/common';

import type { UpdateSettingCommand } from './settings.types';

import { EnsureSettingsSeedDataUseCase } from './use-cases/ensure-settings-seed-data.use-case';
import { ListSettingsUseCase } from './use-cases/list-settings.use-case';
import { UpdateSettingUseCase } from './use-cases/update-setting.use-case';

@Injectable()
export class SettingsService {
  constructor(
    private readonly ensureSettingsSeedDataUseCase: EnsureSettingsSeedDataUseCase,
    private readonly listSettingsUseCase: ListSettingsUseCase,
    private readonly updateSettingUseCase: UpdateSettingUseCase,
  ) {}

  async ensureSeedData(executor?: DatabaseExecutor) {
    return this.ensureSettingsSeedDataUseCase.execute(executor);
  }

  async listAll() {
    return this.listSettingsUseCase.execute();
  }

  async updateByKey(
    actor: AuthenticatedRequestUser,
    key: string,
    input: UpdateSettingCommand,
    requestContext?: RequestContext,
  ) {
    return this.updateSettingUseCase.execute(
      actor,
      key,
      input,
      requestContext,
    );
  }
}
