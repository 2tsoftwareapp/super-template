import { Injectable } from '@nestjs/common';

import type { LogEntry } from './logger.interface';

import { EnvironmentService } from '../../config/environment.service';

@Injectable()
export class HttpLogTransportService {
  constructor(private readonly environmentService: EnvironmentService) {}

  async send(entry: LogEntry): Promise<void> {
    const {
      LOGGING_HTTP_ENDPOINT,
      LOGGING_HTTP_AUTH_TOKEN,
      LOGGING_HTTP_TIMEOUT_MS,
    } = this.environmentService.values;

    // Treat the HTTP sink as opt-in so local and test environments stay console-only by default.
    if (!LOGGING_HTTP_ENDPOINT) {
      return;
    }

    const headers: Record<string, string> = {
      'content-type': 'application/json',
    };

    if (LOGGING_HTTP_AUTH_TOKEN) {
      headers.authorization = `Bearer ${LOGGING_HTTP_AUTH_TOKEN}`;
    }

    // Keep the transport bounded so log export never stalls the request path.
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), LOGGING_HTTP_TIMEOUT_MS);

    try {
      const response = await fetch(LOGGING_HTTP_ENDPOINT, {
        method: 'POST',
        headers,
        body: JSON.stringify(entry),
        signal: controller.signal,
      });

      if (!response.ok) {
        return;
      }
    } catch {
      // Logging must never fail the request path; transport errors are intentionally swallowed.
    } finally {
      clearTimeout(timeout);
    }
  }
}
