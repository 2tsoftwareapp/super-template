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

export function parseAuditLogsFilters(sp: URLSearchParams): AuditLogsFilters {
  return {
    from: sp.get("from") ?? "",
    to: sp.get("to") ?? "",
    q: sp.get("q") ?? "",
    page: Math.max(1, Number(sp.get("page")) || 1),
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

export function formatAuditAction(action: string): string {
  return action
    .replace(/\./g, " · ")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
