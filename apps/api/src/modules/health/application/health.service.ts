import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { ERROR_CODES } from '@repo/api-core/common/constants/error-codes';
import { AppError } from '@repo/api-core/common/errors/app-error';
import { DATABASE } from '@repo/api-database';
import type { DatabaseClient } from '@repo/api-database';

@Injectable()
export class HealthService {
  constructor(@Inject(DATABASE) private readonly database: DatabaseClient) {}

  getLiveness(): { status: 'ok' } {
    return { status: 'ok' };
  }

  async getReadiness(): Promise<{ status: 'ready' }> {
    try {
      await this.database.execute(sql`select 1`);
      return { status: 'ready' };
    } catch {
      throw new AppError(
        ERROR_CODES.INTERNAL_ERROR,
        'Database is not ready',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }
}
