import { bffPath, type operations } from "@repo/api-contract";

import type { ListResponse, OrganizationDto } from "@/lib/api-types";

import { buildPath, webFetch } from "@/lib/http";

type RolesListOperation = operations["AdminRolesController_listRoles"];

export type RolesListParams = NonNullable<
  RolesListOperation["parameters"]["query"]
>;
export type RolesListResponse =
  RolesListOperation["responses"][200]["content"]["application/json"];

/**
 * Cross-feature lookup transport (reference data shared by ≥2 features).
 * Lives in `lib/` so both `src/hooks/` and feature `api/` layers can reuse it
 * without any feature→feature import (CODING_RULES §9–§10).
 */
export function fetchMyOrganizations() {
  return webFetch<ListResponse<OrganizationDto>>(
    buildPath(bffPath("/api/v1/organizations"), { memberOnly: true }),
  );
}

export function fetchOrganizationsList() {
  return webFetch<ListResponse<OrganizationDto>>(
    bffPath("/api/v1/organizations"),
  );
}

export function fetchRolesList(params?: RolesListParams) {
  return webFetch<RolesListResponse>(
    params
      ? buildPath(bffPath("/api/v1/admin/roles"), { ...params })
      : bffPath("/api/v1/admin/roles"),
  );
}
