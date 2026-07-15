"use client";

import { useQuery } from "@tanstack/react-query";

import {
  fetchMyOrganizations,
  fetchOrganizations,
  fetchOrganizationDetail,
  fetchOrganizationMembers,
} from "./organizations.api";
import { organizationsKeys } from "./organizations.query-keys";

export function useMyOrganizationsQuery() {
  return useQuery({
    queryKey: organizationsKeys.my,
    queryFn: fetchMyOrganizations,
    staleTime: 5 * 60_000,
  });
}

export function useOrganizationsQuery(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: organizationsKeys.all,
    queryFn: fetchOrganizations,
    ...options,
  });
}

export function useOrganizationDetailQuery(id: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: organizationsKeys.detail(id),
    queryFn: () => fetchOrganizationDetail(id),
    ...options,
  });
}

export function useOrganizationMembersQuery(id: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: organizationsKeys.members(id),
    queryFn: () => fetchOrganizationMembers(id),
    ...options,
  });
}
