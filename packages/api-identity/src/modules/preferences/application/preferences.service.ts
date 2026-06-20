import type { RequestContext } from '@repo/api-core';

import { Injectable } from '@nestjs/common';

import type { UpdatePreferencesCommand } from './preferences.types';

import { GetPreferencesUseCase } from './use-cases/get-preferences.use-case';
import { UpdatePreferencesUseCase } from './use-cases/update-preferences.use-case';

@Injectable()
export class PreferencesService {
  constructor(
    private readonly getPreferencesUseCase: GetPreferencesUseCase,
    private readonly updatePreferencesUseCase: UpdatePreferencesUseCase,
  ) {}

  async getForUser(userId: string) {
    return this.getPreferencesUseCase.execute(userId);
  }

  async updateForUser(
    userId: string,
    input: UpdatePreferencesCommand,
    requestContext?: RequestContext,
  ) {
    return this.updatePreferencesUseCase.execute(
      userId,
      input,
      requestContext,
    );
  }
}
