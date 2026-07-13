"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchMyOrganizations } from "./organizations.api";
import { organizationsKeys } from "./organizations.query-keys";

export function useMyOrganizationsQuery() {
  return useQuery({
    queryKey: organizationsKeys.my,
    queryFn: fetchMyOrganizations,
    staleTime: 5 * 60_000,
  });
}
