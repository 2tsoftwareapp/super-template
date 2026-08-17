"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchMyOrganizations, fetchOrganizationsList } from "@/lib/lookup-api";
import { organizationsKeys } from "@/lib/query-keys";

const ORGANIZATIONS_STALE_TIME_MS = 5 * 60_000;

/** Organizations the current actor belongs to — used by ≥2 features (§9.1). */
export function useMyOrganizationsQuery() {
  return useQuery({
    queryKey: organizationsKeys.mine(),
    queryFn: () => fetchMyOrganizations(),
    staleTime: ORGANIZATIONS_STALE_TIME_MS,
  });
}

/** Full organizations list (admin scope) — used by ≥2 features (§9.1). */
export function useOrganizationsQuery(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: organizationsKeys.list(),
    queryFn: () => fetchOrganizationsList(),
    staleTime: ORGANIZATIONS_STALE_TIME_MS,
    ...options,
  });
}
