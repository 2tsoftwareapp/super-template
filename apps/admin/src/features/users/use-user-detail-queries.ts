"use client";

import { useQuery } from "@tanstack/react-query";

import { rolesKeys } from "@/features/roles";

import { usersApi } from "./api/users-api";
import { usersKeys } from "./model/users-query-keys";

export function useAdminUserQuery(userId: string) {
  return useQuery({
    queryKey: usersKeys.detail(userId),
    queryFn: () => usersApi.get(userId),
    enabled: Boolean(userId),
  });
}

export function useAdminRolesQuery() {
  return useQuery({
    queryKey: rolesKeys.all,
    queryFn: () => usersApi.listRoles(),
  });
}
