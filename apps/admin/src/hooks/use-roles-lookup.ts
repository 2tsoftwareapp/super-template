"use client";

import { useQuery } from "@tanstack/react-query";

import type { RolesListParams } from "@/lib/lookup-api";

import { fetchRolesList } from "@/lib/lookup-api";
import { rolesKeys } from "@/lib/query-keys";

const ROLES_STALE_TIME_MS = 5 * 60_000;

/** Roles catalog lookup — used by ≥2 features (§9.1). */
export function useRolesQuery(params?: RolesListParams) {
  return useQuery({
    queryKey: rolesKeys.list(params ?? {}),
    queryFn: () => fetchRolesList(params),
    staleTime: ROLES_STALE_TIME_MS,
    placeholderData: (previous) => previous,
  });
}
