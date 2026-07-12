import { Module } from '@nestjs/common';

import { AuditModule } from '../audit/audit.module';
import { EnsureSettingsSeedDataUseCase } from './application/use-cases/ensure-settings-seed-data.use-case';
import { ListSettingsUseCase } from './application/use-cases/list-settings.use-case';
import { UpdateSettingUseCase } from './application/use-cases/update-setting.use-case';
import { SettingsRepository } from './infrastructure/settings.repository';
import { AdminSettingsController } from './presentation/admin-settings.controller';

@Module({
  imports: [AuditModule],
  controllers: [AdminSettingsController],
  providers: [
    SettingsRepository,
    EnsureSettingsSeedDataUseCase,
    ListSettingsUseCase,
    UpdateSettingUseCase,
  ],
  exports: [SettingsRepository, EnsureSettingsSeedDataUseCase],
})
export class SettingsModule {}
