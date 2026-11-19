import type { DatabaseClient, DatabaseExecutor } from "@repo/database-runtime";

import { Inject, Injectable } from "@nestjs/common";
import { DATABASE } from "@repo/database-runtime";
import { and, count, desc, eq, isNull } from "drizzle-orm";

import type { AttachmentsRepositoryPort } from "../application/ports/attachments.repository.port";

import { attachments } from "../../infrastructure/persistence";

@Injectable()
export class AttachmentsRepository implements AttachmentsRepositoryPort {
  constructor(@Inject(DATABASE) private readonly database: DatabaseClient) {}

  async create(
    values: typeof attachments.$inferInsert,
    executor: DatabaseExecutor = this.database,
  ) {
    const [attachment] = await executor.insert(attachments).values(values).returning();

    return attachment ?? null;
  }

  async findById(attachmentId: string, executor: DatabaseExecutor = this.database) {
    const [attachment] = await executor
      .select()
      .from(attachments)
      .where(and(eq(attachments.id, attachmentId), isNull(attachments.deletedAt)))
      .limit(1);

    return attachment ?? null;
  }

  async listByEntity(
    entityType: string,
    entityId: string,
    organizationId?: string | null,
    executor: DatabaseExecutor = this.database,
  ) {
    return executor
      .select()
      .from(attachments)
      .where(
        and(
          eq(attachments.entityType, entityType),
          eq(attachments.entityId, entityId),
          isNull(attachments.deletedAt),
          // RLS is the backstop, not the only fence: an org-scoped caller must
          // not read another organization's metadata for the same entity id.
          organizationId ? eq(attachments.organizationId, organizationId) : undefined,
        ),
      )
      .orderBy(desc(attachments.createdAt));
  }

  async softDelete(attachmentId: string, executor: DatabaseExecutor = this.database) {
    const [attachment] = await executor
      .update(attachments)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(and(eq(attachments.id, attachmentId), isNull(attachments.deletedAt)))
      .returning();

    return attachment ?? null;
  }

  async countByEntity(
    entityType: string,
    entityId: string,
    executor: DatabaseExecutor = this.database,
  ) {
    const [row] = await executor
      .select({ total: count() })
      .from(attachments)
      .where(
        and(
          eq(attachments.entityType, entityType),
          eq(attachments.entityId, entityId),
          isNull(attachments.deletedAt),
        ),
      );

    return Number(row?.total ?? 0);
  }
}
