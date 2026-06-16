import { Global, Module } from '@nestjs/common';
import { ConsoleAppLogger } from './console-logger.service';
import { APP_LOGGER } from './logger.interface';

@Global()
@Module({
  providers: [
    ConsoleAppLogger,
    {
      provide: APP_LOGGER,
      useExisting: ConsoleAppLogger,
    },
  ],
  exports: [APP_LOGGER, ConsoleAppLogger],
})
export class LoggingModule {}
