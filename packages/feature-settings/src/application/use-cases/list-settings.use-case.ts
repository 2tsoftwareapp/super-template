import type { AuthenticatedRequestUser } from "@repo/api-kernel";

import { HttpStatus, Injectable } from "@nestjs/common";
import { AppError, PLATFORM_ROLE_NAMES } from "@repo/api-kernel";
import { ERROR_CODES } from "@repo/api-runtime";

import { SettingsRepository } from "../../infrastructure/settings.repository";
import { SettingsMapper } from "../settings.mapper";

@Injectable()
export class ListSettingsUseCase {
  constructor(private readonly settingsRepository: SettingsRepository) {}

  async execute(actor?: AuthenticatedRequestUser) {
    if (!actor?.roles.includes(PLATFORM_ROLE_NAMES.SUPER_ADMIN)) {
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
