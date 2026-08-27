import type { AuthenticatedRequestUser } from "@repo/api-runtime";

import { HttpStatus, Inject, Injectable } from "@nestjs/common";
import {AppError, ERROR_CODES } from "@repo/api-runtime";
import { ROLE_NAMES } from "@repo/feature-access-control/contracts";

import {
  SETTINGS_REPOSITORY,
  type SettingsRepositoryPort,
} from "../ports/settings.repository.port";
import { SettingsMapper } from "../settings.mapper";

@Injectable()
export class ListSettingsUseCase {
  constructor(
    @Inject(SETTINGS_REPOSITORY) private readonly settingsRepository: SettingsRepositoryPort,
  ) {}

  async execute(actor?: AuthenticatedRequestUser) {
    if (!actor?.roles.includes(ROLE_NAMES.SUPER_ADMIN)) {
      throw new AppError(
        ERROR_CODES.AUTH_FORBIDDEN,
        "Only SUPER_ADMIN can list application settings",
        HttpStatus.FORBIDDEN,
      );
    }

    const settings = await this.settingsRepository.findAll();

    return settings.map((setting) => SettingsMapper.toDto(setting));
  }
}
