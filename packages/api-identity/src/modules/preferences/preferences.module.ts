import { Module } from '@nestjs/common';

import { PreferencesService } from './application/preferences.service';
import { PreferencesRepository } from './infrastructure/preferences.repository';
import { PreferencesController } from './presentation/preferences.controller';

@Module({
  imports: [],
  controllers: [PreferencesController],
  providers: [PreferencesRepository, PreferencesService],
  exports: [PreferencesRepository, PreferencesService],
})
export class PreferencesModule {}
