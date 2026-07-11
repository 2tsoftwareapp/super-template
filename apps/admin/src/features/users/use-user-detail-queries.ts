"use client";

import { useQuery } from "@tanstack/react-query";

import type { AdminUserDto, ListResponse, RoleDto } from "@/lib/api-types";

import { webFetch } from "@/lib/http";

export function useAdminUserQuery(userId: string) {
  return useQuery({
    queryKey: ["admin-user", userId],
    queryFn: () =>
      webFetch<{ data: AdminUserDto }>(`/api/bff/admin/users/${userId}`),
    enabled: Boolean(userId),
  });
}

export function useAdminRolesQuery() {
  return useQuery({
    queryKey: ["admin-roles"],
    queryFn: () => webFetch<ListResponse<RoleDto>>("/api/bff/admin/roles"),
  });
}
