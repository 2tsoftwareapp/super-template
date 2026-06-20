import { HttpStatus, Injectable } from '@nestjs/common';
import { AppError, ERROR_CODES } from '@repo/api-core';

import { PreferencesRepository } from '../../infrastructure/preferences.repository';
import { PreferencesMapper } from '../preferences.mapper';

@Injectable()
export class GetPreferencesUseCase {
  private readonly preferencesMapper = new PreferencesMapper();

  constructor(private readonly preferencesRepository: PreferencesRepository) {}

  async execute(userId: string) {
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

    return this.preferencesMapper.toDto(preferences);
  }
}
