export const auditLogsKeys = {
  all: ["admin-audit-logs"] as const,
  list: (filters: Record<string, unknown>) => [...auditLogsKeys.all, "list", filters] as const,
};
