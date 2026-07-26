import { bffPath, type operations } from "@repo/api-contract";

import type { ListResponse } from "@/lib/api-types";
import { buildPath, webFetch } from "@/lib/http";

import type {
  EditableRole,
  PermissionDto,
  RoleForm,
} from "../model/roles.schemas";

interface RoleSaveResult {
  data: EditableRole & { permissions: PermissionDto[] };
}

type RolesListOperation = operations["AdminRolesController_listRoles"];

export type RolesListParams = NonNullable<
  RolesListOperation["parameters"]["query"]
>;
export type RolesListResponse =
  RolesListOperation["responses"][200]["content"]["application/json"];

function buildRolePayload(input: RoleForm) {
  return {
    name: input.name,
    description: input.description ?? null,
    permissionIds: input.permissionIds,
    ...(input.organizationId ? { organizationId: input.organizationId } : {}),
  };
}

export const rolesApi = {
  list(params?: RolesListParams) {
    return webFetch<RolesListResponse>(
      params
        ? buildPath(bffPath("/api/v1/admin/roles"), { ...params })
        : bffPath("/api/v1/admin/roles"),
    );
  },

  permissions() {
    return webFetch<ListResponse<PermissionDto>>(
      bffPath("/api/v1/admin/roles/permissions"),
    );
  },

  delete(roleId: string) {
    return webFetch(bffPath("/api/v1/admin/roles/{id}", { id: roleId }), {
      method: "DELETE",
    });
  },

  create(input: RoleForm) {
    return webFetch<RoleSaveResult>(bffPath("/api/v1/admin/roles"), {
      method: "POST",
      body: JSON.stringify(buildRolePayload(input)),
    });
  },

  update(roleId: string, input: RoleForm) {
    return webFetch<RoleSaveResult>(
      bffPath("/api/v1/admin/roles/{id}", { id: roleId }),
      {
        method: "PATCH",
        body: JSON.stringify(buildRolePayload(input)),
      },
    );
  },
};

/** @deprecated Prefer `rolesApi` — kept for existing call sites during migration. */
export const fetchRoles = () => rolesApi.list();
export const fetchPermissions = () => rolesApi.permissions();
export const deleteRole = (roleId: string) => rolesApi.delete(roleId);
export const createRole = (input: RoleForm) => rolesApi.create(input);
export const updateRole = (roleId: string, input: RoleForm) =>
  rolesApi.update(roleId, input);
