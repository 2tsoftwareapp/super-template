export const filesKeys = {
  all: ["admin-files"] as const,
  list: (params: Record<string, unknown>) => [...filesKeys.all, "list", params] as const,
  versions: (fileId: string) => [...filesKeys.all, "versions", fileId] as const,
  history: (fileId: string) => [...filesKeys.all, "history", fileId] as const,
};
