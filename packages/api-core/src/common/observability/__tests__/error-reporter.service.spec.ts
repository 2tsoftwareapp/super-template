import { describe, expect, it, vi } from 'vitest';

import type { ErrorReportContext } from '../observability.types';
import type { SentryTransportService } from '../sentry-transport.service';
import type { TelegramTransportService } from '../telegram-transport.service';

import { ErrorReporterService } from '../error-reporter.service';

const context = { requestId: 'req-1', errorCode: 'INTERNAL_ERROR' } as ErrorReportContext;

function createReporter() {
  const sentry = {
    captureException: vi.fn(),
    captureMessage: vi.fn(),
  } as unknown as SentryTransportService;
  const telegram = {
    send: vi.fn().mockResolvedValue(undefined),
  } as unknown as TelegramTransportService;

  return { reporter: new ErrorReporterService(sentry, telegram), sentry, telegram };
}

describe('ErrorReporterService', () => {
  it('fans an exception out to both transports', () => {
    const { reporter, sentry, telegram } = createReporter();
    const error = new Error('boom');

    reporter.reportException(error, context);

    expect(sentry.captureException).toHaveBeenCalledWith(error, context);
    expect(telegram.send).toHaveBeenCalledWith('boom', context);
  });

  it('uses a default title when the error message is empty', () => {
    const { reporter, telegram } = createReporter();

    reporter.reportException(new Error(''), context);

    expect(telegram.send).toHaveBeenCalledWith('Unhandled error', context);
  });

  it('fans a message out to both transports', () => {
    const { reporter, sentry, telegram } = createReporter();

    reporter.reportMessage('something happened', context);

    expect(sentry.captureMessage).toHaveBeenCalledWith('something happened', context);
    expect(telegram.send).toHaveBeenCalledWith('something happened', context);
  });
});
