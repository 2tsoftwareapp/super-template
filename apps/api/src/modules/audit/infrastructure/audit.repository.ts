import { Inject, Injectable } from '@nestjs/common';
import { DATABASE } from '../../../database/database.provider';
import type {
  DatabaseClient,
  DatabaseExecutor,
} from '../../../database/database.types';
import { auditLogs } from '../../../database/schema';

@Injectable()
export class AuditRepository {
  constructor(@Inject(DATABASE) private readonly database: DatabaseClient) {}

  async create(
    values: typeof auditLogs.$inferInsert,
    executor: DatabaseExecutor = this.database,
  ): Promise<typeof auditLogs.$inferSelect> {
    const [auditLog] = await executor
      .insert(auditLogs)
      .values(values)
      .returning();

    if (!auditLog) {
      throw new Error('Audit log insert returned no rows');
    }

    return auditLog;
  }
}
