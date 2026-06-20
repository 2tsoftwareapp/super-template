import { afterEach, describe, expect, it, vi } from 'vitest';

import type { EnvironmentService } from '../../../config/environment.service';
import type { LogEntry } from '../logger.interface';

import { HttpLogTransportService } from '../http-log-transport.service';

function makeService(values: Record<string, unknown>): HttpLogTransportService {
  return new HttpLogTransportService({
    values,
  } as unknown as EnvironmentService);
}

const entry = { level: 'info', message: 'hello' } as unknown as LogEntry;

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('HttpLogTransportService', () => {
  it('is a no-op when no endpoint is configured', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    await makeService({
      LOGGING_HTTP_ENDPOINT: undefined,
      LOGGING_HTTP_AUTH_TOKEN: undefined,
      LOGGING_HTTP_TIMEOUT_MS: 2000,
    }).send(entry);

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('posts the log entry with a bearer token when configured', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', fetchMock);

    await makeService({
      LOGGING_HTTP_ENDPOINT: 'https://logs.example.com/ingest',
      LOGGING_HTTP_AUTH_TOKEN: 'secret-token',
      LOGGING_HTTP_TIMEOUT_MS: 2000,
    }).send(entry);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://logs.example.com/ingest');
    const requestInit = init as RequestInit;
    expect(requestInit.method).toBe('POST');
    expect(
      (requestInit.headers as Record<string, string>).authorization,
    ).toBe('Bearer secret-token');
    expect(JSON.parse(requestInit.body as string)).toEqual(entry);
  });

  it('swallows transport errors so logging never breaks the request path', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('timeout')));

    await expect(
      makeService({
        LOGGING_HTTP_ENDPOINT: 'https://logs.example.com/ingest',
        LOGGING_HTTP_AUTH_TOKEN: undefined,
        LOGGING_HTTP_TIMEOUT_MS: 2000,
      }).send(entry),
    ).resolves.toBeUndefined();
  });
});
