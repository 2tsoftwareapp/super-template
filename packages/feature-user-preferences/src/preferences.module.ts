import { Global, Module } from "@nestjs/common";
import { UsersModule } from "@repo/feature-users/module";

import { PREFERENCES_REPOSITORY } from "./application/ports/preferences.repository.port";
import { PreferencesMapper } from "./application/preferences.mapper";
import { GetPreferencesUseCase } from "./application/use-cases/get-preferences.use-case";
import { ResetPreferencesUseCase } from "./application/use-cases/reset-preferences.use-case";
import { UpdatePreferencesUseCase } from "./application/use-cases/update-preferences.use-case";
import { PreferencesLookupAdapter } from "./infrastructure/preferences-lookup.adapter";
import { PreferencesRepository } from "./infrastructure/preferences.repository";
import { PreferencesController } from "./presentation/preferences.controller";
import { USER_PREFERENCES_LOOKUP } from "./public/user-preferences-lookup.port";

@Global()
@Module({
  imports: [UsersModule],
  controllers: [PreferencesController],
  providers: [
    PreferencesMapper,
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
  exports: [USER_PREFERENCES_LOOKUP],
})
export class PreferencesModule {}
