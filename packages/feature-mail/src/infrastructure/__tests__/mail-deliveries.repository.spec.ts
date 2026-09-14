import type { SQL } from "drizzle-orm";

import { TenantContextService } from "@repo/api-kernel";
import { PgDialect } from "drizzle-orm/pg-core";
import { describe, expect, it, vi } from "vitest";

import { MailDeliveriesRepository } from "../mail-deliveries.repository";

const ORG_A = "11111111-1111-4111-8111-111111111111";
const ORG_B = "22222222-2222-4222-8222-222222222222";

const tenantContext = new TenantContextService();
const dialect = new PgDialect();

/**
 * Build a `list()`-shaped executor: the first `select()` serves the page rows,
 * the second serves the `count()` totals.
 */
function createListExecutor(rowRows: unknown[], totalRows: unknown[]) {
  const offset = vi.fn(async () => rowRows);
  const limit = vi.fn(() => ({ offset }));
  const orderBy = vi.fn(() => ({ limit }));
  const whereRows = vi.fn((condition: SQL) => ({ orderBy }));
  const whereTotals = vi.fn(async () => totalRows);
  let selectCount = 0;
  const from = vi.fn(() => {
    selectCount += 1;
    return selectCount === 1 ? { where: whereRows } : { where: whereTotals };
  });
  const select = vi.fn(() => ({ from }));

  return { client: { select }, whereRows, whereTotals };
}

function createInsertExecutor(rows: unknown[]) {
  const returning = vi.fn(async () => rows);
  const onConflictDoNothing = vi.fn(() => ({ returning }));
  const values = vi.fn((_values: unknown) => ({ onConflictDoNothing }));
  const insert = vi.fn(() => ({ values }));

  return { client: { insert }, insert, values };
}

describe("MailDeliveriesRepository tenant scoping", () => {
  it("stamps the ambient tenant organization on writes", async () => {
    const executor = createInsertExecutor([{ id: "delivery-1", organizationId: ORG_A }]);
    const repository = new MailDeliveriesRepository(executor.client as never);

    await tenantContext.runAsync({ tenantId: ORG_A, userId: "user-1" }, () =>
      repository.create({
        templateKey: "admin.broadcast",
        recipient: "member@example.local",
        subject: "Hello",
        status: "PENDING",
      }),
    );

    expect(executor.values).toHaveBeenCalledWith(
      expect.objectContaining({ organizationId: ORG_A, templateKey: "admin.broadcast" }),
    );
  });

  it("keeps an explicit organization (platform scope) instead of the tenant", async () => {
    const executor = createInsertExecutor([{ id: "delivery-2", organizationId: null }]);
    const repository = new MailDeliveriesRepository(executor.client as never);

    await tenantContext.runAsync({ tenantId: ORG_A, userId: "user-1" }, () =>
      repository.create({
        organizationId: null,
        templateKey: "auth.verify-email",
        recipient: "user@example.local",
        subject: "Verify",
        status: "PENDING",
      }),
    );

    expect(executor.values).toHaveBeenCalledWith(
      expect.objectContaining({ organizationId: null, templateKey: "auth.verify-email" }),
    );
  });

  it("scopes list() to the caller's organization", async () => {
    const executor = createListExecutor([{ id: "delivery-1" }], [{ total: 1 }]);
    const repository = new MailDeliveriesRepository(executor.client as never);

    const result = await tenantContext.runAsync({ tenantId: ORG_A, userId: "user-1" }, () =>
      repository.list({ page: 1, limit: 20 }),
    );

    const { sql: rendered, params } = dialect.sqlToQuery(
      executor.whereRows.mock.calls[0]?.[0] as SQL,
    );

    expect(rendered).toContain('"t_mail_deliveries"."organization_id"');
    expect(params).toContain(ORG_A);
    expect(params).not.toContain(ORG_B);
    expect(result.total).toBe(1);
  });

  it("matches nothing when the caller has no tenant context", async () => {
    const executor = createListExecutor([], [{ total: 0 }]);
    const repository = new MailDeliveriesRepository(executor.client as never);

    const result = await repository.list({ page: 1, limit: 20 });

    const { sql: rendered, params } = dialect.sqlToQuery(
      executor.whereRows.mock.calls[0]?.[0] as SQL,
    );

    expect(rendered).toBe("false");
    expect(params).toEqual([]);
    expect(result.rows).toEqual([]);
    expect(result.total).toBe(0);
  });
});
