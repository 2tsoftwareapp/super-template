export const notificationsKeys = {
  all: ["admin-notifications"] as const,
  jobs: () => [...notificationsKeys.all, "jobs"] as const,
  recent: () => [...notificationsKeys.all, "recent"] as const,
};
