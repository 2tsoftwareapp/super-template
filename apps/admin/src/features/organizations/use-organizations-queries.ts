"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchMyOrganizations } from "./api/organizations-api";
import { organizationsKeys } from "./model/organizations-query-keys";

export function useMyOrganizationsQuery() {
  return useQuery({
    queryKey: organizationsKeys.my,
    queryFn: fetchMyOrganizations,
    staleTime: 5 * 60_000,
  });
}
