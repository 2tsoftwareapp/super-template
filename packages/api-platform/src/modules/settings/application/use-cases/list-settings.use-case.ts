import { Injectable } from '@nestjs/common';

import { SettingsRepository } from '../../infrastructure/settings.repository';
import { SettingsMapper } from '../settings.mapper';

@Injectable()
export class ListSettingsUseCase {
  constructor(private readonly settingsRepository: SettingsRepository) {}

  async execute() {
    const settings = await this.settingsRepository.findAll();

    return settings.map((setting) => SettingsMapper.toDto(setting));
  }
}
