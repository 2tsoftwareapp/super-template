export const usersKeys = {
  all: ["admin-users"] as const,
  list: (params: { listPath: string; sortKey: string }) =>
    [...usersKeys.all, "list", params] as const,
  detail: (id: string) => [...usersKeys.all, "detail", id] as const,
};
