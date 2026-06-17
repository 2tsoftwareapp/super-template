import { Module } from '@nestjs/common';

import { AuditModule } from '../audit/audit.module';
import { SettingsService } from './application/settings.service';
import { SettingsRepository } from './infrastructure/settings.repository';
import { AdminSettingsController } from './presentation/admin-settings.controller';

@Module({
  imports: [AuditModule],
  controllers: [AdminSettingsController],
  providers: [SettingsRepository, SettingsService],
  exports: [SettingsRepository, SettingsService],
})
export class SettingsModule {}
