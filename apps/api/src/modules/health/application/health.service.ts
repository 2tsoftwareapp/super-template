import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { ERROR_CODES } from '../../../common/constants/error-codes';
import { AppError } from '../../../common/errors/app-error';
import { DATABASE } from '../../../database/database.provider';
import type { DatabaseClient } from '../../../database/database.types';

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
