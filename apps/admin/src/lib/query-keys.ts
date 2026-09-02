import type { RolesListParams } from "@/lib/lookup-api";

/**
 * Query-key factories shared between feature mutations (invalidation) and the
 * cross-feature lookup hooks in `src/hooks/`. Keeping them in `lib/` means no
 * layer needs a feature→feature import to stay cache-consistent.
 */
export const organizationsKeys = {
  all: ["admin-organizations"] as const,
  mine: () => [...organizationsKeys.all, "mine"] as const,
  lists: () => [...organizationsKeys.all, "list"] as const,
  list: () => [...organizationsKeys.lists()] as const,
  details: () => [...organizationsKeys.all, "detail"] as const,
  detail: (id: string) => [...organizationsKeys.details(), id] as const,
  members: (id: string) => [...organizationsKeys.all, "members", id] as const,
  member: (orgId: string, userId: string) => [...organizationsKeys.members(orgId), userId] as const,
};

export const rolesKeys = {
  all: ["admin-roles"] as const,
  lists: () => [...rolesKeys.all, "list"] as const,
  list: (params: RolesListParams) => [...rolesKeys.lists(), params] as const,
  permissions: () => [...rolesKeys.all, "permissions"] as const,
};
