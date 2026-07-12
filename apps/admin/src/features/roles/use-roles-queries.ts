"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchPermissions, fetchRoles } from "./api/roles-api";
import { PERMISSION_CATALOG_QUERY_KEY, ROLES_QUERY_KEY } from "./model/roles-query-keys";

export function useRolesQuery() {
  return useQuery({
    queryKey: ROLES_QUERY_KEY,
    queryFn: fetchRoles,
  });
}

export function usePermissionCatalogQuery() {
  return useQuery({
    queryKey: PERMISSION_CATALOG_QUERY_KEY,
    queryFn: fetchPermissions,
  });
}
