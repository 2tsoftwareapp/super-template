import { Inject, Injectable, Logger } from '@nestjs/common';
import type { Pool } from 'pg';
import type { AdvisoryLockPort } from '@repo/api-core';

import { ADVISORY_LOCK_POOL } from './database.provider';

@Injectable()
export class PostgresAdvisoryLockService implements AdvisoryLockPort {
  private readonly logger = new Logger(PostgresAdvisoryLockService.name);

  constructor(@Inject(ADVISORY_LOCK_POOL) private readonly pool: Pool) {}

  async withAdvisoryLock<T>(lockId: number, fn: () => Promise<T>): Promise<T | null> {
    const client = await this.pool.connect();
    
    try {
      const { rows } = await client.query('SELECT pg_try_advisory_lock($1) as locked', [lockId]);
      const locked = rows[0]?.locked === true;
      
      if (!locked) {
        return null;
      }
      
      const result = await fn();
      return result;
    } catch (error) {
      this.logger.error(`Error executing locked function (lockId: ${lockId})`, error);
      throw error;
    } finally {
      // Release the session-level advisory lock
      try {
        await client.query('SELECT pg_advisory_unlock($1)', [lockId]);
      } catch (unlockError) {
        this.logger.error(`Failed to unlock advisory lock (lockId: ${lockId})`, unlockError);
      }
      // Release connection back to pool
      client.release();
    }
  }
}
