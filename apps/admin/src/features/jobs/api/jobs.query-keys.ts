export const jobsKeys = {
  all: ["admin-jobs"] as const,
  lists: () => [...jobsKeys.all, "list"] as const,
  list: (params: Record<string, unknown>) =>
    [...jobsKeys.lists(), params] as const,
  /** Shared with dashboard overview metrics query. */
  metrics: ["admin-jobs", "metrics"] as const,
  detail: (id: string) => [...jobsKeys.all, "detail", id] as const,
  logs: (id: string) => [...jobsKeys.all, "logs", id] as const,
};
