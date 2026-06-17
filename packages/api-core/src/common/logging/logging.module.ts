import { Global, Module } from '@nestjs/common';

import { ErrorReporterService } from '../observability/error-reporter.service';
import { SentryTransportService } from '../observability/sentry-transport.service';
import { TelegramTransportService } from '../observability/telegram-transport.service';
import { ConsoleAppLogger } from './console-logger.service';
import { HttpLogTransportService } from './http-log-transport.service';
import { APP_LOGGER } from './logger.interface';

@Global()
@Module({
  providers: [
    HttpLogTransportService,
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
