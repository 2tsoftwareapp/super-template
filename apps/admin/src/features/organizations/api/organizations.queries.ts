"use client";

import { useQuery } from "@tanstack/react-query";

import { organizationsApi } from "./organizations.api";
import { organizationsKeys } from "./organizations.query-keys";

const ORGANIZATIONS_STALE_TIME_MS = 5 * 60_000;

export function useMyOrganizationsQuery() {
  return useQuery({
    queryKey: organizationsKeys.mine(),
    queryFn: () => organizationsApi.mine(),
    staleTime: ORGANIZATIONS_STALE_TIME_MS,
  });
}

export function useOrganizationsQuery(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: organizationsKeys.list(),
    queryFn: () => organizationsApi.list(),
    staleTime: ORGANIZATIONS_STALE_TIME_MS,
    ...options,
  });
}

export function useOrganizationDetailQuery(
  id: string,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: organizationsKeys.detail(id),
    queryFn: () => organizationsApi.get(id),
    ...options,
  });
}

export function useOrganizationMembersQuery(
  id: string,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: organizationsKeys.members(id),
    queryFn: () => organizationsApi.members(id),
    ...options,
  });
}
