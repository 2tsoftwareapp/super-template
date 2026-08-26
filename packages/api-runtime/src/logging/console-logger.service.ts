import { Injectable, Logger } from "@nestjs/common";
import { type AppLogger, type LogContext, type LogEntry, type LogLevel } from "@repo/api-kernel";

@Injectable()
export class ConsoleAppLogger implements AppLogger {
  private readonly logger = new Logger("App");

  info(message: string, context?: LogContext): void {
    this.write("info", message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.write("warn", message, context);
  }

  error(message: string, context?: LogContext): void {
    this.write("error", message, context);
  }

  private write(level: LogLevel, message: string, context?: LogContext): void {
    const payload: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...(context ? { context } : {}),
    };

    const serialized = JSON.stringify({
      ...payload,
      ...(context ?? {}),
    });

    if (level === "error") {
      this.logger.error(serialized);
    } else if (level === "warn") {
      this.logger.warn(serialized);
    } else {
      this.logger.log(serialized);
    }
  }
}
