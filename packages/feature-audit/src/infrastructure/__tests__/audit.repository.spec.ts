import type { SQL } from "drizzle-orm";

import { getTableName } from "drizzle-orm";
import { PgDialect } from "drizzle-orm/pg-core";
import { describe, expect, it, vi } from "vitest";

import { AuditRepository } from "../audit.repository";
import { auditLogs } from "../persistence";

const dialect = new PgDialect();
const cutoff = new Date("2026-01-01T00:00:00.000Z");

/**
 * Capture the raw statement handed to the driver. `deleteOlderThanBatched`
 * builds a `sql` template, so the fake executor only has to record it.
 */
function createExecutingCapture(rowCount: number | null) {
  const execute = vi.fn(async () => ({ rowCount }));

  return { execute };
}

describe("AuditRepository.deleteOlderThanBatched", () => {
  it("renders table and column names from the Drizzle object, not from literals", async () => {
    const executor = createExecutingCapture(2);
    const repository = new AuditRepository({} as never);
    // Identifiers are read back from the schema object, so this assertion fails
    // both when the query hardcodes a name and when the schema is renamed
    // without the query following it.
    const tableName = getTableName(auditLogs);

    const deleted = await repository.deleteOlderThanBatched(cutoff, 500, executor as never);

    expect(deleted).toBe(2);

    const [statement] = executor.execute.mock.calls[0] as unknown as [SQL];
    const { sql: rendered, params } = dialect.sqlToQuery(statement);

    expect(rendered).toContain(`DELETE FROM "${tableName}"`);
    expect(rendered).toContain(`SELECT "${tableName}"."id" FROM "${tableName}"`);
    expect(rendered).toContain(`"${tableName}"."created_at" <= $1`);
    expect(rendered).toContain(`ORDER BY "${tableName}"."created_at"`);
    expect(params).toEqual([cutoff, 500]);
  });

  it("treats a driver result without rowCount as zero deleted rows", async () => {
    const executor = createExecutingCapture(null);
    const repository = new AuditRepository({} as never);

    await expect(repository.deleteOlderThanBatched(cutoff, 100, executor as never)).resolves.toBe(
      0,
    );
  });
});
