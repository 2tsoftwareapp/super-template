import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import {
  AppHealthIndicator,
  DatabaseHealthIndicator,
} from './application/health.indicators';
import { HealthController } from './presentation/health.controller';

@Module({
  imports: [TerminusModule],
  controllers: [HealthController],
  providers: [AppHealthIndicator, DatabaseHealthIndicator],
})
export class HealthModule {}
