export const jobsKeys = {
  all: ["admin-jobs"] as const,
  list: (params: Record<string, unknown>) => [...jobsKeys.all, "list", params] as const,
  metrics: ["admin-jobs-metrics"] as const,
  detail: (id: string) => [...jobsKeys.all, "detail", id] as const,
  logs: (id: string) => [...jobsKeys.all, "logs", id] as const,
};
