import type { DatabaseClient, DatabaseExecutor } from "@repo/database-runtime";

import { Inject, Injectable } from "@nestjs/common";
import { isPostgresUniqueViolation, runIdempotentInsert } from "@repo/database-runtime";
import { DATABASE } from "@repo/database-runtime";
import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  ilike,
  isNotNull,
  isNull,
  lte,
  notInArray,
} from "drizzle-orm";

import type {
  CreateFileBatchOperationInput,
  FileListResult,
  FilesRepositoryPort,
  JsonObject,
  ListFilesQuery,
} from "../application/ports/files.repository.port";

import { fileBatchOperations, files, fileVersions } from "../../infrastructure/persistence";
import { FileVersionConflictError } from "../domain/errors";

const FILE_SORT_FIELDS = {
  createdAt: files.createdAt,
  originalName: files.originalName,
  sizeBytes: files.sizeBytes,
} as const;

@Injectable()
export class FilesRepository implements FilesRepositoryPort {
  constructor(@Inject(DATABASE) private readonly database: DatabaseClient) {}

  async create(values: typeof files.$inferInsert, executor: DatabaseExecutor = this.database) {
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

  async listSoftDeleted(limit: number, executor: DatabaseExecutor = this.database) {
    return executor
      .select()
      .from(files)
      .where(isNotNull(files.deletedAt))
      .orderBy(desc(files.deletedAt))
      .limit(limit);
  }

  async list(params: ListFilesQuery, executor: DatabaseExecutor = this.database) {
    const filters = [];
    if (params.organizationId) {
      filters.push(eq(files.organizationId, params.organizationId));
    } else {
      filters.push(isNull(files.organizationId));
    }

    if (!params.includeDeleted) {
      filters.push(isNull(files.deletedAt));
    }

    if (params.search) {
      filters.push(ilike(files.originalName, `%${params.search}%`));
    }

    if (params.mimeType) {
      // FE mime chips send prefixes (`image/`); exact MIME still uses equality.
      if (params.mimeType.endsWith("/")) {
        filters.push(ilike(files.mimeType, `${params.mimeType}%`));
      } else {
        filters.push(eq(files.mimeType, params.mimeType));
      }
    }

    if (params.uploadedById) {
      filters.push(eq(files.uploadedById, params.uploadedById));
    }

    if (params.from) {
      filters.push(gte(files.createdAt, new Date(params.from)));
    }

    if (params.to) {
      filters.push(lte(files.createdAt, new Date(params.to)));
    }

    if (params.excludeKinds && params.excludeKinds.length > 0) {
      filters.push(notInArray(files.kind, params.excludeKinds));
    }

    if (params.excludeVisibilities && params.excludeVisibilities.length > 0) {
      filters.push(notInArray(files.visibility, params.excludeVisibilities));
    }

    const whereClause = and(...filters);
    const offset = (params.page - 1) * params.limit;
    const sortColumn = FILE_SORT_FIELDS[params.sortField];

    const [rows, totals] = await Promise.all([
      executor
        .select()
        .from(files)
        .where(whereClause)
        .orderBy(params.sortOrder === "asc" ? asc(sortColumn) : desc(sortColumn))
        .limit(params.limit)
        .offset(offset),
      executor.select({ total: count() }).from(files).where(whereClause),
    ]);

    return {
      rows,
      total: Number(totals[0]?.total ?? 0),
    } satisfies FileListResult;
  }

  async setCurrentVersion(
    fileId: string,
    values: {
      storageKey: string;
      mimeType: string;
      sizeBytes: number;
      checksum: string;
      latestVersion: number;
    },
    expectedLatestVersion: number,
    executor: DatabaseExecutor = this.database,
  ) {
    // CAS guard: only bump the current version if nobody else already did.
    // Under concurrent uploads the losing UPDATE matches zero rows -> null.
    const [file] = await executor
      .update(files)
      .set({ ...values, updatedAt: new Date() })
      .where(and(eq(files.id, fileId), eq(files.latestVersion, expectedLatestVersion)))
      .returning();

    return file ?? null;
  }

  async createVersion(
    values: typeof fileVersions.$inferInsert,
    executor: DatabaseExecutor = this.database,
  ) {
    try {
      const [version] = await executor.insert(fileVersions).values(values).returning();

      if (!version) {
        throw new Error("File version insert returned no rows");
      }

      return version;
    } catch (error) {
      // A concurrent upload computed the same version number and won the
      // unique (file_id, version_number) index — surface a soft conflict to
      // the application layer instead of leaking the raw DB error.
      if (isPostgresUniqueViolation(error)) {
        throw new FileVersionConflictError();
      }
      throw error;
    }
  }

  async listVersions(fileId: string, executor: DatabaseExecutor = this.database) {
    return executor
      .select()
      .from(fileVersions)
      .where(eq(fileVersions.fileId, fileId))
      .orderBy(desc(fileVersions.versionNumber));
  }

  async findBatchOperationByIdempotencyKey(
    actorId: string,
    idempotencyKey: string,
    executor: DatabaseExecutor = this.database,
  ) {
    const [operation] = await executor
      .select()
      .from(fileBatchOperations)
      .where(
        and(
          eq(fileBatchOperations.actorId, actorId),
          eq(fileBatchOperations.idempotencyKey, idempotencyKey),
        ),
      )
      .limit(1);

    return operation ?? null;
  }

  async createBatchOperation(
    values: typeof fileBatchOperations.$inferInsert,
    executor: DatabaseExecutor = this.database,
  ) {
    const [operation] = await executor.insert(fileBatchOperations).values(values).returning();

    if (!operation) {
      throw new Error("File batch operation insert returned no rows");
    }

    return operation;
  }

  async createBatchOperationIdempotent(
    input: Omit<CreateFileBatchOperationInput, "results" | "idempotencyKey"> & {
      idempotencyKey: string;
    },
    computeResults: () => Promise<JsonObject[]>,
    executor: DatabaseExecutor = this.database,
  ): Promise<JsonObject[] | null> {
    // Atomic idempotency: concurrent inserts with the same key collide on the
    // partial unique index; runIdempotentInsert absorbs the race by fetching
    // the concurrent record instead of surfacing a 500.
    const result = await runIdempotentInsert(
      async () => {
        const results = await computeResults();
        const operation = await this.createBatchOperation({ ...input, results }, executor);
        return operation.results;
      },
      async () => {
        const operation = await this.findBatchOperationByIdempotencyKey(
          input.actorId,
          input.idempotencyKey,
          executor,
        );
        return operation?.results ?? null;
      },
    );

    return result?.value ?? null;
  }
}
