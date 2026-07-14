import { Module } from '@nestjs/common';
import { USER_PREFERENCES_LOOKUP } from '@repo/api-core';

import { UsersModule } from '../users/users.module';
import { PREFERENCES_REPOSITORY } from './application/ports/preferences.repository.port';
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
    {
      provide: PREFERENCES_REPOSITORY,
      useExisting: PreferencesRepository,
    },
    PreferencesLookupAdapter,
    GetPreferencesUseCase,
    UpdatePreferencesUseCase,
    ResetPreferencesUseCase,
    {
      provide: USER_PREFERENCES_LOOKUP,
      useExisting: PreferencesLookupAdapter,
    },
  ],
  exports: [
    USER_PREFERENCES_LOOKUP,
  ],
})
export class PreferencesModule {}
