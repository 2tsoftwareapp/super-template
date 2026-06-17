import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';

import {
  AppHealthIndicator,
  DatabaseHealthIndicator,
} from './application/health.indicators';
import { HealthController } from './presentation/health.controller';

@Module({
  // Terminus provides the standard NestJS health-check primitives used by both liveness and readiness probes.
  imports: [TerminusModule],
  // The controller exposes the legacy HTTP contract while the indicators encapsulate the actual checks.
  controllers: [HealthController],
  providers: [AppHealthIndicator, DatabaseHealthIndicator],
})
export class HealthModule {}
