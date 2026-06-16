import { Inject, Injectable } from '@nestjs/common';
import { and, desc, eq, isNotNull, isNull } from 'drizzle-orm';
import { DATABASE } from '@repo/api-database';
import type {
  DatabaseClient,
  DatabaseExecutor,
} from '@repo/api-database';
import { files } from '@repo/api-database';

@Injectable()
export class FilesRepository {
  constructor(@Inject(DATABASE) private readonly database: DatabaseClient) {}

  async create(
    values: typeof files.$inferInsert,
    executor: DatabaseExecutor = this.database,
  ) {
    const [file] = await executor.insert(files).values(values).returning();
    return file ?? null;
  }

  async findById(fileId: string, executor: DatabaseExecutor = this.database) {
    const [file] = await executor
      .select()
      .from(files)
      .where(and(eq(files.id, fileId), isNull(files.deletedAt)))
      .limit(1);

    return file ?? null;
  }

  async softDelete(fileId: string, executor: DatabaseExecutor = this.database) {
    const [file] = await executor
      .update(files)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(and(eq(files.id, fileId), isNull(files.deletedAt)))
      .returning();

    return file ?? null;
  }

  async listSoftDeleted(
    limit: number,
    executor: DatabaseExecutor = this.database,
  ) {
    return executor
      .select()
      .from(files)
      .where(isNotNull(files.deletedAt))
      .orderBy(desc(files.deletedAt))
      .limit(limit);
  }
}
