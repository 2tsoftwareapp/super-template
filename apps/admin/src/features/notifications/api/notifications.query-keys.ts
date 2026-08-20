export const notificationsKeys = {
  all: ["admin-notifications"] as const,
  jobs: (params?: { sortOrder?: "asc" | "desc" | undefined }) =>
    [...notificationsKeys.all, "jobs", params] as const,
  recent: () => [...notificationsKeys.all, "recent"] as const,
};
