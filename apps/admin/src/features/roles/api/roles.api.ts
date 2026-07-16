import type { ListResponse } from "@/lib/api-types";

import { webFetch } from "@/lib/http";

import type {
  EditableRole,
  ManagedRoleDto,
  PermissionDto,
  RoleForm,
} from "../model/roles.schemas";

interface RoleSaveResult { data: EditableRole & { permissions: PermissionDto[] } }

function buildRolePayload(input: RoleForm) {
  return {
    name: input.name,
    description: input.description ?? null,
    permissionIds: input.permissionIds,
    ...(input.organizationId ? { organizationId: input.organizationId } : {}),
  };
}

export async function fetchRoles() {
  return webFetch<ListResponse<ManagedRoleDto>>("/api/bff/admin/roles");
}

export async function fetchPermissions() {
  return webFetch<ListResponse<PermissionDto>>(
    "/api/bff/admin/roles/permissions",
  );
}

export async function deleteRole(roleId: string) {
  return webFetch(`/api/bff/admin/roles/${roleId}`, { method: "DELETE" });
}

export async function createRole(input: RoleForm) {
  return webFetch<RoleSaveResult>("/api/bff/admin/roles", {
    method: "POST",
    body: JSON.stringify(buildRolePayload(input)),
  });
}

export async function updateRole(roleId: string, input: RoleForm) {
  return webFetch<RoleSaveResult>(`/api/bff/admin/roles/${roleId}`, {
    method: "PATCH",
    body: JSON.stringify(buildRolePayload(input)),
  });
}
