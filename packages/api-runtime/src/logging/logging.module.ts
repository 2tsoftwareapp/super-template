import { Global, Module } from "@nestjs/common";
import { APP_LOGGER } from "@repo/api-kernel";
import {
  ErrorReporterService,
  OBSERVABILITY_ENV,
  SentryTransportService,
  TelegramTransportService,
} from "@repo/observability";

import { AppConfigModule, EnvironmentService } from "../config/environment";
import { ConsoleAppLogger } from "./console-logger.service";

@Global()
@Module({
  // AppConfigModule is also @Global; import ensures EnvironmentService exists for OBSERVABILITY_ENV.
  imports: [AppConfigModule],
  providers: [
    {
      provide: OBSERVABILITY_ENV,
      useExisting: EnvironmentService,
    },
    SentryTransportService,
    TelegramTransportService,
    ErrorReporterService,
    ConsoleAppLogger,
    {
      provide: APP_LOGGER,
      useExisting: ConsoleAppLogger,
    },
  ],
  exports: [APP_LOGGER, ConsoleAppLogger, ErrorReporterService],
})
export class LoggingModule {}
