import { Module } from '@nestjs/common';
import { USER_PREFERENCES_LOOKUP } from '@repo/api-core';

import { UsersModule } from '../users/users.module';
import { PreferencesService } from './application/preferences.service';
import { GetPreferencesUseCase } from './application/use-cases/get-preferences.use-case';
import { ResetPreferencesUseCase } from './application/use-cases/reset-preferences.use-case';
import { UpdatePreferencesUseCase } from './application/use-cases/update-preferences.use-case';
import { PreferencesLookupAdapter } from './infrastructure/preferences-lookup.adapter';
import { PreferencesRepository } from './infrastructure/preferences.repository';
import { PreferencesController } from './presentation/preferences.controller';

@Module({
  imports: [UsersModule],
  controllers: [PreferencesController],
  providers: [
    PreferencesRepository,
    PreferencesLookupAdapter,
    GetPreferencesUseCase,
    UpdatePreferencesUseCase,
    ResetPreferencesUseCase,
    PreferencesService,
    {
      provide: USER_PREFERENCES_LOOKUP,
      useExisting: PreferencesLookupAdapter,
    },
  ],
  exports: [
    PreferencesRepository,
    PreferencesService,
    USER_PREFERENCES_LOOKUP,
  ],
})
export class PreferencesModule {}
