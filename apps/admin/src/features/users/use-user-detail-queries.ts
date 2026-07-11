"use client";

import { useQuery } from "@tanstack/react-query";

import type { AdminUserDto, ListResponse, RoleDto } from "@/lib/api-types";

import { ROLES_QUERY_KEY } from "@/features/roles/use-roles-queries";
import { webFetch } from "@/lib/http";

export const USER_DETAIL_QUERY_KEY = "admin-user" as const;

export function useAdminUserQuery(userId: string) {
  return useQuery({
    queryKey: [USER_DETAIL_QUERY_KEY, userId],
    queryFn: () =>
      webFetch<{ data: AdminUserDto }>(`/api/bff/admin/users/${userId}`),
    enabled: Boolean(userId),
  });
}

export function useAdminRolesQuery() {
  return useQuery({
    queryKey: ROLES_QUERY_KEY,
    queryFn: () => webFetch<ListResponse<RoleDto>>("/api/bff/admin/roles"),
  });
}
