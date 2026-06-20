import { Module } from '@nestjs/common';

import { PreferencesService } from './application/preferences.service';
import { GetPreferencesUseCase } from './application/use-cases/get-preferences.use-case';
import { UpdatePreferencesUseCase } from './application/use-cases/update-preferences.use-case';
import { PreferencesRepository } from './infrastructure/preferences.repository';
import { PreferencesController } from './presentation/preferences.controller';

@Module({
  imports: [],
  controllers: [PreferencesController],
  providers: [
    PreferencesRepository,
    GetPreferencesUseCase,
    UpdatePreferencesUseCase,
    PreferencesService,
  ],
  exports: [PreferencesRepository, PreferencesService],
})
export class PreferencesModule {}
