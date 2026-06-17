import { Module } from '@nestjs/common';
import { AuditModule } from '@repo/api-platform/modules/audit/audit.module';

import { PreferencesService } from './application/preferences.service';
import { PreferencesRepository } from './infrastructure/preferences.repository';
import { PreferencesController } from './presentation/preferences.controller';

@Module({
  imports: [AuditModule],
  controllers: [PreferencesController],
  providers: [PreferencesRepository, PreferencesService],
  exports: [PreferencesRepository, PreferencesService],
})
export class PreferencesModule {}
