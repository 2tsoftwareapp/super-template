"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchMyOrganizations } from "./api/organizations-api";
import { MY_ORGANIZATIONS_QUERY_KEY } from "./model/organizations-query-keys";

export function useMyOrganizationsQuery() {
  return useQuery({
    queryKey: [MY_ORGANIZATIONS_QUERY_KEY],
    queryFn: fetchMyOrganizations,
    staleTime: 5 * 60_000,
  });
}
