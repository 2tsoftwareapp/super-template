import { dateParam, pageParam, parseSearchParams, searchTextParam } from "@repo/web-utils/params";
import { z } from "zod";

/**
 * Pure audit-logs list state: filter shape, URL parsing/serialization and
 * action formatting. Framework-free (no React / HTTP / router).
 */
export interface AuditLogsFilters {
  from: string;
  to: string;
  q: string;
  page: number;
}

const auditLogsFiltersSchema = z.object({
  from: dateParam,
  to: dateParam,
  q: searchTextParam(500),
  page: pageParam,
});

const AUDIT_LOGS_FILTERS_FALLBACK = {
  from: undefined,
  to: undefined,
  q: "",
  page: 1,
} as const;

export function parseAuditLogsFilters(sp: URLSearchParams): AuditLogsFilters {
  const parsed = parseSearchParams(auditLogsFiltersSchema, sp, AUDIT_LOGS_FILTERS_FALLBACK);

  return {
    from: parsed.data.from ?? "",
    to: parsed.data.to ?? "",
    q: parsed.data.q,
    page: parsed.data.page,
  };
}

export function serializeAuditLogsFilters(filters: AuditLogsFilters): string {
  const sp = new URLSearchParams();
  if (filters.from) sp.set("from", filters.from);
  if (filters.to) sp.set("to", filters.to);
  if (filters.q) sp.set("q", filters.q);
  if (filters.page > 1) sp.set("page", String(filters.page));
  return sp.toString();
}

/** Display helper for audit action keys — used by the handler, not UI. */
export function formatAuditAction(action: string): string {
  return action
    .replace(/\./g, " · ")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
