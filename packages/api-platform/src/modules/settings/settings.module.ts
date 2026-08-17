import { Module } from "@nestjs/common";
import { APPLICATION_SETTINGS_LOOKUP } from "@repo/api-core";

import { AuditModule } from "../audit/audit.module";
import { ApplicationSettingsLookupService } from "./application/application-settings-lookup.service";
import { SETTINGS_REPOSITORY } from "./application/ports/settings.repository.port";
import { EnsureSettingsSeedDataUseCase } from "./application/use-cases/ensure-settings-seed-data.use-case";
import { ListSettingsUseCase } from "./application/use-cases/list-settings.use-case";
import { UpdateSettingUseCase } from "./application/use-cases/update-setting.use-case";
import { SettingsRepository } from "./infrastructure/settings.repository";
import { AdminSettingsController } from "./presentation/admin-settings.controller";

@Module({
  imports: [AuditModule],
  controllers: [AdminSettingsController],
  providers: [
    SettingsRepository,
    EnsureSettingsSeedDataUseCase,
    ListSettingsUseCase,
    UpdateSettingUseCase,
    ApplicationSettingsLookupService,
    {
      provide: SETTINGS_REPOSITORY,
      useExisting: SettingsRepository,
    },
    {
      provide: APPLICATION_SETTINGS_LOOKUP,
      useExisting: ApplicationSettingsLookupService,
    },
  ],
  exports: [SETTINGS_REPOSITORY, APPLICATION_SETTINGS_LOOKUP, EnsureSettingsSeedDataUseCase],
})
export class SettingsModule {}
