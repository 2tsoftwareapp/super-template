export const filesKeys = {
  all: ["admin-files"] as const,
  lists: () => [...filesKeys.all, "list"] as const,
  list: (params: Record<string, unknown>) => [...filesKeys.lists(), params] as const,
  versions: (fileId: string) => [...filesKeys.all, "versions", fileId] as const,
  history: (fileId: string) => [...filesKeys.all, "history", fileId] as const,
};
