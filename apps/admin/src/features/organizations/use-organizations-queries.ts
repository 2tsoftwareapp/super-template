"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchMyOrganizations } from "./organizations-service";

export const MY_ORGANIZATIONS_QUERY_KEY = "admin-my-organizations" as const;

export function useMyOrganizationsQuery() {
  return useQuery({
    queryKey: [MY_ORGANIZATIONS_QUERY_KEY],
    queryFn: fetchMyOrganizations,
    staleTime: 5 * 60_000,
  });
}
