export const importsKeys = {
  all: ["admin-import-job"] as const,
  detail: (id: string) => [...importsKeys.all, "detail", id] as const,
};
