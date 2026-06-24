"use client";

import { useQuery } from "@tanstack/react-query";

import type {
  AdminUserDto,
  ListResponse,
} from "@/lib/api-types";

import { webFetch } from "@/lib/http";

import type { UsersListParams } from "./types";

import { buildUsersListPath } from "./api";
import { USERS_QUERY_KEY } from "./constants";
import { usersSortKey } from "./sorting";

export function useUsersListQuery(params: UsersListParams) {
  const listPath = buildUsersListPath(params);

  return useQuery({
    queryKey: [USERS_QUERY_KEY, listPath, usersSortKey(params.sort)],
    queryFn: () => webFetch<ListResponse<AdminUserDto>>(listPath),
    placeholderData: (previous) => previous,
  });
}
