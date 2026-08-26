/** Duck-typed env surface used by observability transports (implemented by EnvironmentService). */
export interface ObservabilityEnvValues {
  readonly SENTRY_DSN?: string | null;
  readonly SENTRY_ENVIRONMENT?: string | null;
  readonly SENTRY_RELEASE?: string | null;
  readonly TELEGRAM_ERROR_BOT_TOKEN?: string | null;
  readonly TELEGRAM_ERROR_BOT_CHAT_ID?: string | null;
  readonly TELEGRAM_ERROR_BOT_TIMEOUT_MS?: number | null;
}

export interface ObservabilityEnvironment {
  readonly sentryDsn: string | null | undefined;
  readonly telegramBotToken: string | null | undefined;
  readonly telegramChatId: string | null | undefined;
  readonly appEnv: string;
  readonly values: ObservabilityEnvValues;
}

/** Injection token so observability stays free of a hard Nest dependency on api-runtime. */
export const OBSERVABILITY_ENV = Symbol("OBSERVABILITY_ENV");
