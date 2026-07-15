import { formatSortParam } from "@repo/api-sort";

import type {
  AdminUserDto,
  CreateAdminUserInput,
  ListResponse,
  RoleDto,
  UpdateAdminUserInput,
} from "@/lib/api-types";

import { webFetch } from "@/lib/http";
import { buildAdminUsersListPath } from "@/lib/search-params";

import type { UsersListParams } from "../model/types";

export function buildUsersListPath(params: UsersListParams) {
  const primarySort = params.sort[0] ?? { field: "createdAt", order: "desc" };
  const overrides = {
    page: params.page,
    limit: params.limit,
    search: params.search.trim(),
    status: params.status === "all" ? "ALL" : params.status,
    sortField: primarySort.field,
    sortOrder: primarySort.order,
  } as const;

  let listPath = buildAdminUsersListPath(overrides);

  if (params.sort.length > 1) {
    const url = new URL(listPath, "http://localhost");
    url.searchParams.set("sort", formatSortParam(params.sort));
    listPath = url.pathname + url.search;
  }

  return listPath;
}

/**
 * Users transport layer. The only place in the feature that talks HTTP; query
 * and mutation hooks call these functions instead of webFetch directly.
 */
export const usersApi = {
  list(params: UsersListParams) {
    return webFetch<ListResponse<AdminUserDto>>(buildUsersListPath(params));
  },

  get(userId: string) {
    return webFetch<{ data: AdminUserDto }>(`/api/bff/admin/users/${userId}`);
  },

  listRoles() {
    return webFetch<ListResponse<RoleDto>>("/api/bff/admin/roles");
  },

  create(input: CreateAdminUserInput) {
    return webFetch<{ data: AdminUserDto }>("/api/bff/admin/users", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  updateProfile(userId: string, input: UpdateAdminUserInput) {
    return webFetch<{ data: AdminUserDto }>(`/api/bff/admin/users/${userId}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    });
  },

  updateStatus(userId: string, status: string) {
    return webFetch<{ data: AdminUserDto }>(
      `/api/bff/admin/users/${userId}/status`,
      { method: "PATCH", body: JSON.stringify({ status }) },
    );
  },

  replaceRoles(userId: string, roleId: string, organizationId?: string) {
    return webFetch<{ data: AdminUserDto }>(
      `/api/bff/admin/users/${userId}/roles`,
      { method: "PUT", body: JSON.stringify({ roleId, organizationId }) },
    );
  },

  delete(userId: string) {
    return webFetch(`/api/bff/admin/users/${userId}`, { method: "DELETE" });
  },

  resendVerification(email: string) {
    return webFetch("/api/bff/auth/resend-verification", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  },
};
