import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { AppError, ERROR_CODES } from '@repo/api-core';
import { DATABASE, type DatabaseClient } from '@repo/api-database';
import { sql } from 'drizzle-orm';

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
