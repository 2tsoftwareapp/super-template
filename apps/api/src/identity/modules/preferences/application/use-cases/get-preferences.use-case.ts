import { HttpStatus, Inject, Injectable } from "@nestjs/common";
import { AppError, ERROR_CODES } from "@repo/api-core";

import {
  PREFERENCES_REPOSITORY,
  type PreferencesRepositoryPort,
} from "../ports/preferences.repository.port";
import { PreferencesMapper } from "../preferences.mapper";

@Injectable()
export class GetPreferencesUseCase {
  constructor(
    @Inject(PREFERENCES_REPOSITORY)
    private readonly preferencesRepository: PreferencesRepositoryPort,
    private readonly preferencesMapper: PreferencesMapper,
  ) {}

  async execute(userId: string) {
    const preferences =
      (await this.preferencesRepository.findByUserId(userId)) ??
      (await this.preferencesRepository.upsert(userId, {}));

    if (!preferences) {
      throw new AppError(
        ERROR_CODES.INTERNAL_ERROR,
        "Failed to load user preferences",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    return this.preferencesMapper.toDto(preferences);
  }
}
