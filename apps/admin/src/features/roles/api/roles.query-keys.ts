import type { RolesListParams } from "./roles.api";

export const rolesKeys = {
  all: ["admin-roles"] as const,
  lists: () => [...rolesKeys.all, "list"] as const,
  list: (params: RolesListParams) => [...rolesKeys.lists(), params] as const,
  permissions: () => [...rolesKeys.all, "permissions"] as const,
};
