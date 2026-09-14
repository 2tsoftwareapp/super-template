import type { SQL } from "drizzle-orm";

import { getTableName } from "drizzle-orm";
import { PgDialect } from "drizzle-orm/pg-core";
import { describe, expect, it, vi } from "vitest";

import { FileVersionConflictError } from "../../domain/errors";
import { fileVersions, files } from "../../../infrastructure/persistence";
import { FilesRepository } from "../files.repository";

const dialect = new PgDialect();
const FILES_TABLE = getTableName(files);
const VERSIONS_TABLE = getTableName(fileVersions);

const render = (clause: SQL) => dialect.sqlToQuery(clause);

/** `select({ total: count() })` must be distinguishable from `select({ id })`. */
const isCountProjection = (projection: unknown) =>
  typeof projection === "object" && projection !== null && "total" in projection;

const thenable = <T extends object>(rows: unknown[], extra: T) =>
  Object.assign(Promise.resolve(rows), extra);

/**
 * Drizzle read-chain stand-in. `where()` resolves on its own (the lookups) and
 * also carries `.orderBy()/.limit()`; `orderBy()` carries `.limit()` and is
 * itself awaitable, matching `listVersions` returning the chain directly.
 */
function createReadExecutor(rows: unknown[] = [], total = rows.length) {
  const offset = vi.fn<(count: number) => Promise<unknown[]>>(async () => rows);
  const limit = vi.fn<(count: number) => Promise<unknown[]> & { offset: typeof offset }>(() =>
    thenable(rows, { offset }),
  );
  const orderBy = vi.fn<(...clauses: SQL[]) => Promise<unknown[]> & { limit: typeof limit }>(() =>
    thenable(rows, { limit }),
  );
  const where = vi.fn<
    (clause: SQL) => Promise<unknown[]> & { orderBy: typeof orderBy; limit: typeof limit }
  >(() => thenable(rows, { orderBy, limit }));
  const from = vi.fn(() => ({ where }));

  const countWhere = vi.fn<(clause: SQL) => Promise<Array<{ total: number }>>>(async () => [
    { total },
  ]);
  const countFrom = vi.fn(() => ({ where: countWhere }));

  const select = vi.fn((projection?: unknown) =>
    isCountProjection(projection) ? { from: countFrom } : { from },
  );

  return { client: { select }, select, from, where, countWhere, orderBy, limit, offset };
}

/** Captures `insert().values().returning()` and `update().set().where().returning()`. */
function createWriteExecutor(options: { insertRows?: unknown[]; updateRows?: unknown[] } = {}) {
  const { insertRows = [], updateRows = [] } = options;

  const returning = vi.fn(async () => updateRows);
  const where = vi.fn<(clause: SQL) => { returning: typeof returning }>(() => ({ returning }));
  const set = vi.fn<(values: Record<string, unknown>) => { where: typeof where }>(() => ({
    where,
  }));
  const update = vi.fn(() => ({ set }));

  const insertReturning = vi.fn(async () => insertRows);
  const values = vi.fn<(values: Record<string, unknown>) => { returning: typeof insertReturning }>(
    () => ({ returning: insertReturning }),
  );
  const insert = vi.fn(() => ({ values }));

  return {
    client: { insert, update },
    insert,
    values,
    insertReturning,
    update,
    set,
    where,
    returning,
  };
}

describe("FilesRepository.create", () => {
  it("returns null when the insert produced no row", async () => {
    const executor = createWriteExecutor({ insertRows: [] });
    const repository = new FilesRepository(executor.client as never);

    await expect(
      repository.create({ storageKey: "k", originalName: "n" } as never, executor.client as never),
    ).resolves.toBeNull();
  });

  it("returns the inserted row", async () => {
    const executor = createWriteExecutor({ insertRows: [{ id: "file-1" }] });
    const repository = new FilesRepository(executor.client as never);

    await expect(
      repository.create({ storageKey: "k", originalName: "n" } as never, executor.client as never),
    ).resolves.toEqual({ id: "file-1" });
  });
});

describe("FilesRepository.setCurrentVersion (CAS guard)", () => {
  it("fences the version bump on the expected latest_version", async () => {
    const executor = createWriteExecutor({ updateRows: [{ id: "file-1", latestVersion: 2 }] });
    const repository = new FilesRepository(executor.client as never);

    await expect(
      repository.setCurrentVersion(
        "file-1",
        {
          storageKey: "uploads/new.png",
          mimeType: "image/png",
          sizeBytes: 10,
          checksum: "def",
          latestVersion: 2,
        },
        1,
        executor.client as never,
      ),
    ).resolves.toEqual({ id: "file-1", latestVersion: 2 });

    const { sql: rendered, params } = render(executor.where.mock.calls[0]![0]);
    // Without the latest_version predicate a concurrent upload could overwrite
    // a newer state; the guard is what makes the update compare-and-swap.
    expect(rendered).toContain(`"${FILES_TABLE}"."id" = $1`);
    expect(rendered).toContain(`"${FILES_TABLE}"."latest_version" = $2`);
    expect(params).toEqual(["file-1", 1]);
    expect(executor.set).toHaveBeenCalledWith(
      expect.objectContaining({ latestVersion: 2, storageKey: "uploads/new.png" }),
    );
  });

  it("returns null when a concurrent upload already advanced the version", async () => {
    const executor = createWriteExecutor({ updateRows: [] });
    const repository = new FilesRepository(executor.client as never);

    await expect(
      repository.setCurrentVersion(
        "file-1",
        { storageKey: "k", mimeType: "image/png", sizeBytes: 1, checksum: "c", latestVersion: 2 },
        1,
        executor.client as never,
      ),
    ).resolves.toBeNull();
  });
});

describe("FilesRepository.softDelete", () => {
  it("only stamps rows that are not already soft-deleted", async () => {
    const executor = createWriteExecutor({ updateRows: [{ id: "file-1" }] });
    const repository = new FilesRepository(executor.client as never);

    await repository.softDelete("file-1", executor.client as never);

    const { sql: rendered, params } = render(executor.where.mock.calls[0]![0]);
    expect(rendered).toContain(`"${FILES_TABLE}"."id" = $1`);
    expect(rendered).toContain(`"${FILES_TABLE}"."deleted_at" is null`);
    expect(params).toEqual(["file-1"]);
    expect(executor.set).toHaveBeenCalledWith(
      expect.objectContaining({ deletedAt: expect.any(Date), updatedAt: expect.any(Date) }),
    );
  });

  it("returns null when the file was already deleted", async () => {
    const executor = createWriteExecutor({ updateRows: [] });
    const repository = new FilesRepository(executor.client as never);

    await expect(repository.softDelete("file-1", executor.client as never)).resolves.toBeNull();
  });
});

describe("FilesRepository.list", () => {
  const baseQuery = {
    page: 1,
    limit: 20,
    sortField: "createdAt",
    sortOrder: "desc",
  } as const;

  it("scopes to the organization and hides soft-deleted files by default", async () => {
    const executor = createReadExecutor([], 0);
    const repository = new FilesRepository(executor.client as never);

    await repository.list({ ...baseQuery, organizationId: "org-1" }, executor.client as never);

    const { sql: rendered, params } = render(executor.where.mock.calls[0]![0]);
    expect(rendered).toContain(`"${FILES_TABLE}"."organization_id" = $1`);
    expect(rendered).toContain(`"${FILES_TABLE}"."deleted_at" is null`);
    expect(params).toEqual(["org-1"]);
  });

  it("matches organization-less files when no organization is given", async () => {
    const executor = createReadExecutor([], 0);
    const repository = new FilesRepository(executor.client as never);

    await repository.list({ ...baseQuery, organizationId: null }, executor.client as never);

    const { sql: rendered, params } = render(executor.where.mock.calls[0]![0]);
    expect(rendered).toContain(`"${FILES_TABLE}"."organization_id" is null`);
    expect(params).toEqual([]);
  });

  it("includes soft-deleted files only when explicitly asked", async () => {
    const executor = createReadExecutor([], 0);
    const repository = new FilesRepository(executor.client as never);

    await repository.list(
      { ...baseQuery, organizationId: "org-1", includeDeleted: true },
      executor.client as never,
    );

    // The deleted_at predicate is dropped entirely, not merely widened.
    expect(render(executor.where.mock.calls[0]![0]).sql).not.toContain("deleted_at");
  });

  it("treats a trailing slash mime type as a prefix and an exact type as equality", async () => {
    const executor = createReadExecutor([], 0);
    const repository = new FilesRepository(executor.client as never);

    await repository.list(
      { ...baseQuery, organizationId: "org-1", mimeType: "image/" },
      executor.client as never,
    );
    const prefix = render(executor.where.mock.calls[0]![0]);
    expect(prefix.sql).toContain(`"${FILES_TABLE}"."mime_type" ilike $2`);
    expect(prefix.params).toEqual(["org-1", "image/%"]);

    executor.where.mockClear();
    await repository.list(
      { ...baseQuery, organizationId: "org-1", mimeType: "image/png" },
      executor.client as never,
    );
    const exact = render(executor.where.mock.calls[0]![0]);
    expect(exact.sql).toContain(`"${FILES_TABLE}"."mime_type" = $2`);
    expect(exact.params).toEqual(["org-1", "image/png"]);
  });

  it("applies search, uploader and date-range filters", async () => {
    const executor = createReadExecutor([], 0);
    const repository = new FilesRepository(executor.client as never);
    const from = "2026-01-01T00:00:00.000Z";
    const to = "2026-02-01T00:00:00.000Z";

    await repository.list(
      { ...baseQuery, organizationId: "org-1", search: "report", uploadedById: "user-1", from, to },
      executor.client as never,
    );

    const { sql: rendered, params } = render(executor.where.mock.calls[0]![0]);
    expect(rendered).toContain(`"${FILES_TABLE}"."original_name" ilike`);
    expect(rendered).toContain(`"${FILES_TABLE}"."uploaded_by_id" = `);
    expect(rendered).toContain(`"${FILES_TABLE}"."created_at" >= `);
    expect(rendered).toContain(`"${FILES_TABLE}"."created_at" <= `);
    // The ISO strings are parsed into Dates before binding, so they come back
    // in canonical form rather than verbatim.
    expect(params).toEqual(["org-1", "%report%", "user-1", from, to]);
  });

  it("excludes the audit-export kind and restricted visibility via NOT IN", async () => {
    const executor = createReadExecutor([], 0);
    const repository = new FilesRepository(executor.client as never);

    await repository.list(
      {
        ...baseQuery,
        organizationId: "org-1",
        excludeKinds: ["AUDIT_EXPORT"],
        excludeVisibilities: ["RESTRICTED"],
      },
      executor.client as never,
    );

    const { sql: rendered, params } = render(executor.where.mock.calls[0]![0]);
    expect(rendered).toContain(`"${FILES_TABLE}"."kind" not in`);
    expect(rendered).toContain(`"${FILES_TABLE}"."visibility" not in`);
    expect(params).toEqual(["org-1", "AUDIT_EXPORT", "RESTRICTED"]);
  });

  it("ignores empty exclusion lists", async () => {
    const executor = createReadExecutor([], 0);
    const repository = new FilesRepository(executor.client as never);

    await repository.list(
      { ...baseQuery, organizationId: "org-1", excludeKinds: [], excludeVisibilities: [] },
      executor.client as never,
    );

    const { sql: rendered } = render(executor.where.mock.calls[0]![0]);
    expect(rendered).not.toContain("not in");
  });

  it("orders and paginates by the requested field, size and page", async () => {
    const executor = createReadExecutor([], 0);
    const repository = new FilesRepository(executor.client as never);

    await repository.list(
      {
        ...baseQuery,
        organizationId: "org-1",
        sortField: "sizeBytes",
        sortOrder: "asc",
        page: 3,
        limit: 25,
      },
      executor.client as never,
    );

    expect(render(executor.orderBy.mock.calls[0]![0]!).sql).toBe(
      `"${FILES_TABLE}"."size_bytes" asc`,
    );
    expect(executor.limit).toHaveBeenCalledWith(25);
    expect(executor.offset).toHaveBeenCalledWith(50);
  });

  it("applies the same filter to the rows and the total", async () => {
    const executor = createReadExecutor([], 7);
    const repository = new FilesRepository(executor.client as never);

    const result = await repository.list(
      { ...baseQuery, organizationId: "org-1" },
      executor.client as never,
    );

    expect(render(executor.where.mock.calls[0]![0]).sql).toBe(
      render(executor.countWhere.mock.calls[0]![0]).sql,
    );
    expect(result.total).toBe(7);
  });
});

describe("FilesRepository.createVersion", () => {
  it("returns the inserted version", async () => {
    const executor = createWriteExecutor({ insertRows: [{ id: "version-1" }] });
    const repository = new FilesRepository(executor.client as never);

    await expect(
      repository.createVersion({ fileId: "file-1" } as never, executor.client as never),
    ).resolves.toEqual({ id: "version-1" });
  });

  it("maps a unique violation on (file_id, version_number) to a soft conflict", async () => {
    const executor = createWriteExecutor({ insertRows: [{ id: "unused" }] });
    const repository = new FilesRepository(executor.client as never);
    executor.values.mockImplementationOnce(() => ({
      returning: vi.fn(async () => {
        throw Object.assign(new Error("duplicate key value"), { code: "23505" });
      }),
    }));

    await expect(
      repository.createVersion({ fileId: "file-1" } as never, executor.client as never),
    ).rejects.toBeInstanceOf(FileVersionConflictError);
  });

  it("does not swallow unrelated database errors", async () => {
    const executor = createWriteExecutor();
    const repository = new FilesRepository(executor.client as never);
    executor.values.mockImplementationOnce(() => ({
      returning: vi.fn(async () => {
        throw Object.assign(new Error("connection reset"), { code: "08006" });
      }),
    }));

    await expect(
      repository.createVersion({ fileId: "file-1" } as never, executor.client as never),
    ).rejects.toThrow("connection reset");
  });

  it("treats a unique violation carried on the error cause as a conflict", async () => {
    const executor = createWriteExecutor();
    const repository = new FilesRepository(executor.client as never);
    executor.values.mockImplementationOnce(() => ({
      returning: vi.fn(async () => {
        throw Object.assign(new Error("wrapped"), { cause: { code: "23505" } });
      }),
    }));

    await expect(
      repository.createVersion({ fileId: "file-1" } as never, executor.client as never),
    ).rejects.toBeInstanceOf(FileVersionConflictError);
  });

  it("refuses to report success when the version insert returned no rows", async () => {
    const executor = createWriteExecutor({ insertRows: [] });
    const repository = new FilesRepository(executor.client as never);

    await expect(
      repository.createVersion({ fileId: "file-1" } as never, executor.client as never),
    ).rejects.toThrow("File version insert returned no rows");
  });
});

describe("FilesRepository.listVersions", () => {
  it("reads the file's versions newest first", async () => {
    const executor = createReadExecutor([{ id: "version-2" }]);
    const repository = new FilesRepository(executor.client as never);

    await expect(repository.listVersions("file-1", executor.client as never)).resolves.toEqual([
      { id: "version-2" },
    ]);

    const { sql: rendered, params } = render(executor.where.mock.calls[0]![0]);
    expect(rendered).toContain(`"${VERSIONS_TABLE}"."file_id" = $1`);
    expect(params).toEqual(["file-1"]);
    expect(render(executor.orderBy.mock.calls[0]![0]!).sql).toBe(
      `"${VERSIONS_TABLE}"."version_number" desc`,
    );
  });
});

describe("FilesRepository.listSoftDeleted", () => {
  it("reads only soft-deleted files, most recently deleted first", async () => {
    const executor = createReadExecutor([{ id: "file-1" }]);
    const repository = new FilesRepository(executor.client as never);

    await repository.listSoftDeleted(5, executor.client as never);

    const { sql: rendered } = render(executor.where.mock.calls[0]![0]);
    expect(rendered).toContain(`"${FILES_TABLE}"."deleted_at" is not null`);
    expect(render(executor.orderBy.mock.calls[0]![0]!).sql).toBe(
      `"${FILES_TABLE}"."deleted_at" desc`,
    );
    expect(executor.limit).toHaveBeenCalledWith(5);
  });
});

describe("FilesRepository.createBatchOperationIdempotent", () => {
  const input = { organizationId: "org-1", actorId: "user-1", operation: "delete" };

  it("returns the freshly computed results when the insert wins", async () => {
    const repository = new FilesRepository({} as never);
    const createSpy = vi
      .spyOn(repository, "createBatchOperation")
      .mockResolvedValue({ results: [{ id: "file-1" }] } as never);
    const computeResults = vi.fn(async () => [{ id: "file-1" }]);

    await expect(
      repository.createBatchOperationIdempotent(
        { ...input, idempotencyKey: "key-1" },
        computeResults,
        {} as never,
      ),
    ).resolves.toEqual([{ id: "file-1" }]);

    expect(computeResults).toHaveBeenCalledTimes(1);
    expect(createSpy).toHaveBeenCalledWith(
      expect.objectContaining({ idempotencyKey: "key-1", results: [{ id: "file-1" }] }),
      expect.anything(),
    );
  });

  it("replays the concurrent operation's results instead of surfacing a conflict", async () => {
    const repository = new FilesRepository({} as never);
    vi.spyOn(repository, "createBatchOperation").mockRejectedValue(
      Object.assign(new Error("duplicate key value"), { code: "23505" }),
    );
    const findSpy = vi
      .spyOn(repository, "findBatchOperationByIdempotencyKey")
      .mockResolvedValue({ results: [{ id: "concurrent" }] } as never);
    const computeResults = vi.fn(async () => [{ id: "file-1" }]);

    await expect(
      repository.createBatchOperationIdempotent(
        { ...input, idempotencyKey: "key-1" },
        computeResults,
        {} as never,
      ),
    ).resolves.toEqual([{ id: "concurrent" }]);

    // The replay must read the row the concurrent request committed.
    expect(findSpy).toHaveBeenCalledWith("user-1", "key-1", expect.anything());
  });

  it("returns null when neither the insert nor a replay produced results", async () => {
    const repository = new FilesRepository({} as never);
    vi.spyOn(repository, "createBatchOperation").mockRejectedValue(
      Object.assign(new Error("duplicate key value"), { code: "23505" }),
    );
    vi.spyOn(repository, "findBatchOperationByIdempotencyKey").mockResolvedValue(null);

    await expect(
      repository.createBatchOperationIdempotent(
        { ...input, idempotencyKey: "key-1" },
        async () => [],
        {} as never,
      ),
    ).resolves.toBeNull();
  });

  it("propagates a non-unique insert failure", async () => {
    const repository = new FilesRepository({} as never);
    vi.spyOn(repository, "createBatchOperation").mockRejectedValue(new Error("connection reset"));

    await expect(
      repository.createBatchOperationIdempotent(
        { ...input, idempotencyKey: "key-1" },
        async () => [],
        {} as never,
      ),
    ).rejects.toThrow("connection reset");
  });
});
