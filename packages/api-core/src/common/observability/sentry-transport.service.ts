import { Injectable } from '@nestjs/common';
import * as Sentry from '@sentry/node';

import type { ErrorReportContext } from './observability.types';

import { EnvironmentService } from '../../config/environment.service';

let sentryInitialized = false;

@Injectable()
export class SentryTransportService {
  constructor(private readonly environmentService: EnvironmentService) {}

  captureException(error: Error, context: ErrorReportContext): void {
    const dsn = this.environmentService.sentryDsn;

    if (!dsn) {
      return;
    }

    this.ensureInitialized();

    Sentry.withScope((scope) => {
      this.applyContext(scope, context);
      Sentry.captureException(error);
    });
  }

  captureMessage(message: string, context: ErrorReportContext): void {
    const dsn = this.environmentService.sentryDsn;

    if (!dsn) {
      return;
    }

    this.ensureInitialized();

    Sentry.withScope((scope) => {
      this.applyContext(scope, context);
      Sentry.captureMessage(message);
    });
  }

  private ensureInitialized(): void {
    if (sentryInitialized) {
      return;
    }

    const {
      SENTRY_DSN,
      SENTRY_ENVIRONMENT,
      SENTRY_RELEASE,
    } = this.environmentService.values;

    if (!SENTRY_DSN) {
      return;
    }

    Sentry.init({
      dsn: SENTRY_DSN,
      environment: SENTRY_ENVIRONMENT ?? this.environmentService.appEnv,
      release: SENTRY_RELEASE ?? undefined,
      tracesSampleRate: 0,
    });

    sentryInitialized = true;
  }

  private applyContext(
    scope: Sentry.Scope,
    context: ErrorReportContext,
  ): void {
    if (context.requestId) {
      scope.setTag('requestId', context.requestId);
    }

    if (context.method) {
      scope.setTag('method', context.method);
    }

    if (context.path) {
      scope.setTag('path', context.path);
    }

    if (context.errorCode) {
      scope.setTag('errorCode', context.errorCode);
    }

    if (typeof context.statusCode === 'number') {
      scope.setTag('statusCode', String(context.statusCode));
    }

    if (typeof context.userId === 'string') {
      scope.setUser({ id: context.userId });
    }

    if (context.tags) {
      scope.setTags(context.tags);
    }

    scope.setContext('report', {
      ...context,
      details: context.details ?? null,
    });
  }
}
