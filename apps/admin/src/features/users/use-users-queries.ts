"use client";

import { useQuery } from "@tanstack/react-query";

import type { UsersListParams } from "./model/types";

import { buildUsersListPath, usersApi } from "./api/users-api";
import { usersSortKey } from "./model/sorting";
import { usersKeys } from "./model/users-query-keys";

export function useUsersListQuery(params: UsersListParams) {
  const listPath = buildUsersListPath(params);

  return useQuery({
    queryKey: usersKeys.list({ listPath, sortKey: usersSortKey(params.sort) }),
    queryFn: () => usersApi.list(params),
    placeholderData: (previous) => previous,
  });
}
