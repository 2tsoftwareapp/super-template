import { Injectable, Logger } from '@nestjs/common';
import type { AppLogger, LogContext } from './logger.interface';

@Injectable()
export class ConsoleAppLogger implements AppLogger {
  private readonly logger = new Logger('App');

  info(message: string, context?: LogContext): void {
    this.write('info', message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.write('warn', message, context);
  }

  error(message: string, context?: LogContext): void {
    this.write('error', message, context);
  }

  private write(
    level: 'info' | 'warn' | 'error',
    message: string,
    context?: LogContext,
  ): void {
    const payload = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...context,
    };

    const serialized = JSON.stringify(payload);

    if (level === 'error') {
      this.logger.error(serialized);
      return;
    }

    if (level === 'warn') {
      this.logger.warn(serialized);
      return;
    }

    this.logger.log(serialized);
  }
}
