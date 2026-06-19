import type { JsonObject } from '../types/json-value';

export const APP_LOGGER = Symbol('APP_LOGGER');

export type LogContext = JsonObject;

export type LogLevel = 'info' | 'warn' | 'error';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
}

export interface AppLogger {
  info(message: string, context?: LogContext): void;
  warn(message: string, context?: LogContext): void;
  error(message: string, context?: LogContext): void;
}
