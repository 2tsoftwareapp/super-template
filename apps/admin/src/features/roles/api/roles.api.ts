import { bffPath } from "@repo/api-contract";

import type { ListResponse } from "@/lib/api-types";

import { webFetch } from "@/lib/http";

import type {
  EditableRole,
  ManagedRoleDto,
  PermissionDto,
  RoleForm,
} from "../model/roles.schemas";

interface RoleSaveResult {
  data: EditableRole & { permissions: PermissionDto[] };
}

export interface RolesListParams {
  page?: number;
  limit?: number;
  search?: string;
  organizationId?: string;
  scope?: string;
}

function buildRolesListPath(params: RolesListParams): string {
  const searchParams = new URLSearchParams();
  if (params.page && params.page > 1) searchParams.set("page", String(params.page));
  if (params.limit && params.limit !== 50) searchParams.set("limit", String(params.limit));
  if (params.search) searchParams.set("search", params.search);
  if (params.organizationId) searchParams.set("organizationId", params.organizationId);
  if (params.scope) searchParams.set("scope", params.scope);
  const qs = searchParams.toString();
  return qs ? `${bffPath("/api/v1/admin/roles")}?${qs}` : bffPath("/api/v1/admin/roles");
}

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
    return webFetch<ListResponse<ManagedRoleDto>>(
      params ? buildRolesListPath(params) : bffPath("/api/v1/admin/roles"),
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
