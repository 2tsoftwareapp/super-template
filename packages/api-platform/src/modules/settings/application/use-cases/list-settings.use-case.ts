import { Inject, Injectable } from '@nestjs/common';

import { SETTINGS_REPOSITORY, type SettingsRepositoryPort } from '../ports/settings.repository.port';
import { SettingsMapper } from '../settings.mapper';

@Injectable()
export class ListSettingsUseCase {
  constructor(@Inject(SETTINGS_REPOSITORY) private readonly settingsRepository: SettingsRepositoryPort) {}

  async execute() {
    const settings = await this.settingsRepository.findAll();

    return settings.map((setting) => SettingsMapper.toDto(setting));
  }
}
