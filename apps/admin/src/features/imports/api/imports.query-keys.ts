export const importsKeys = {
  all: ["admin-imports"] as const,
  details: () => [...importsKeys.all, "detail"] as const,
  detail: (jobId: string) => [...importsKeys.details(), jobId] as const,
};
