"use client";

import { useQuery } from "@tanstack/react-query";

import { sortKey } from "@/lib/table-sort";

import type { UsersListParams } from "../model/users.types";

import { buildUsersListPath, usersApi } from "./users.api";
import { usersKeys } from "./users.query-keys";

export function useUsersListQuery(params: UsersListParams) {
  const listPath = buildUsersListPath(params);

  return useQuery({
    queryKey: usersKeys.list({ listPath, sortKey: sortKey(params.sort) }),
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
