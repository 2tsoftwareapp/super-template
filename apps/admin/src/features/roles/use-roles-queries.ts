"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchPermissions, fetchRoles } from "./roles-service";

export const ROLES_QUERY_KEY = ["admin-roles"] as const;
export const PERMISSION_CATALOG_QUERY_KEY = ["admin-permissions"] as const;

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
