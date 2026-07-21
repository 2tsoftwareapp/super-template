"use client";

import { useQuery } from "@tanstack/react-query";

import type { UsersListParams } from "../model/types";

import { usersSortKey } from "../model/sorting";
import { buildUsersListPath, usersApi } from "./users.api";
import { usersKeys } from "./users.query-keys";

export function useUsersListQuery(params: UsersListParams) {
  const listPath = buildUsersListPath(params);

  return useQuery({
    queryKey: usersKeys.list({ listPath, sortKey: usersSortKey(params.sort) }),
    queryFn: () => usersApi.list(params),
    placeholderData: (previous) => previous,
  });
}

export function useAdminUserQuery(userId: string) {
  return useQuery({
    queryKey: usersKeys.detail(userId),
    queryFn: () => usersApi.get(userId),
    enabled: Boolean(userId),
  });
}
