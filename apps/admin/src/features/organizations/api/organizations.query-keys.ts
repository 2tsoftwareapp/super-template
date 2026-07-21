export const organizationsKeys = {
  all: ["admin-organizations"] as const,
  mine: () => [...organizationsKeys.all, "mine"] as const,
  lists: () => [...organizationsKeys.all, "list"] as const,
  list: () => [...organizationsKeys.lists()] as const,
  details: () => [...organizationsKeys.all, "detail"] as const,
  detail: (id: string) => [...organizationsKeys.details(), id] as const,
  members: (id: string) => [...organizationsKeys.all, "members", id] as const,
};
