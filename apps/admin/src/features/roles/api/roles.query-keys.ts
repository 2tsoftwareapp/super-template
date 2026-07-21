export const rolesKeys = {
  all: ["admin-roles"] as const,
  lists: () => [...rolesKeys.all, "list"] as const,
  list: () => [...rolesKeys.lists()] as const,
  permissions: () => [...rolesKeys.all, "permissions"] as const,
};
