export { useDeleteRoleMutation, useSaveRoleMutation } from "./api/roles.mutations";
// The cross-feature `useRolesQuery` lookup lives in `@/hooks/use-roles-lookup`;
// `rolesKeys` in `@/lib/query-keys`.
export { usePermissionCatalogQuery } from "./api/roles.queries";
export { useRolesController } from "./controllers/use-roles-controller";
export type { RoleManagementPermissions } from "./model/roles.permissions";
export type { EditableRole, ManagedRoleDto, PermissionDto, RoleForm } from "./model/roles.schemas";
export type { RolesViewModel } from "./model/roles.types";
export { RolesView } from "./screens/roles-view";