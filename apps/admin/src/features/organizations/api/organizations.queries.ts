"use client";

import { useQuery } from "@tanstack/react-query";

import { organizationsApi } from "./organizations.api";
import { organizationsKeys } from "./organizations.query-keys";

// Cross-feature lookups (mine/list) live in `@/hooks/use-organizations-lookup`.
// This file keeps only the feature-specific detail/members queries.

export function useOrganizationDetailQuery(id: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: organizationsKeys.detail(id),
    queryFn: () => organizationsApi.get(id),
    ...options,
  });
}

export function useOrganizationMembersQuery(id: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: organizationsKeys.members(id),
    queryFn: () => organizationsApi.members(id),
    ...options,
  });
}
