"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchPermissions, fetchRoles } from "./api/roles-api";
import { rolesKeys } from "./model/roles-query-keys";

export function useRolesQuery() {
  return useQuery({
    queryKey: rolesKeys.all,
    queryFn: fetchRoles,
  });
}

export function usePermissionCatalogQuery() {
  return useQuery({
    queryKey: rolesKeys.permissionCatalog,
    queryFn: fetchPermissions,
  });
}
