"use client";

import { useQuery } from "@tanstack/react-query";

import type { RolesListParams } from "./roles.api";
import { rolesApi } from "./roles.api";
import { rolesKeys } from "./roles.query-keys";

const ROLES_STALE_TIME_MS = 5 * 60_000;

export function useRolesQuery(params?: RolesListParams) {
  return useQuery({
    queryKey: rolesKeys.list(params ?? {}),
    queryFn: () => rolesApi.list(params),
    staleTime: ROLES_STALE_TIME_MS,
    placeholderData: (previous) => previous,
  });
}

export function useRoleCatalogQuery() {
  return useQuery({
    queryKey: rolesKeys.all,
    queryFn: () => rolesApi.list(),
    staleTime: ROLES_STALE_TIME_MS,
  });
}

export function usePermissionCatalogQuery() {
  return useQuery({
    queryKey: rolesKeys.permissions(),
    queryFn: () => rolesApi.permissions(),
    staleTime: ROLES_STALE_TIME_MS,
  });
}
