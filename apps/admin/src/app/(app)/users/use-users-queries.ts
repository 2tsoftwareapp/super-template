"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type {
  AdminUserDto,
  ListResponse,
  RoleDto,
  UpdateUserStatusInput,
} from "@/lib/api-types";

import { webFetch } from "@/lib/http";

import type { UsersListParams } from "./types";

import { buildUsersListPath } from "./api";
import { ROLES_QUERY_KEY, USERS_QUERY_KEY } from "./constants";
import { usersSortKey } from "./sorting";

export function useAdminRolesQuery(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: [ROLES_QUERY_KEY],
    queryFn: () => webFetch<ListResponse<RoleDto>>("/api/bff/admin/roles"),
    enabled: options?.enabled ?? true,
  });
}

export function useUsersListQuery(params: UsersListParams) {
  const listPath = buildUsersListPath(params);

  return useQuery({
    queryKey: [USERS_QUERY_KEY, listPath, usersSortKey(params.sort)],
    queryFn: () => webFetch<ListResponse<AdminUserDto>>(listPath),
    placeholderData: (previous) => previous,
  });
}

export function useUpdateUsersStatusMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userIds,
      status,
    }: {
      userIds: string[];
      status: UpdateUserStatusInput["status"];
    }) =>
      Promise.all(
        userIds.map((userId) =>
          webFetch<{ data: AdminUserDto }>(
            `/api/bff/admin/users/${userId}/status`,
            {
              method: "PATCH",
              body: JSON.stringify({ status } satisfies UpdateUserStatusInput),
            },
          ),
        ),
      ),
    onSuccess: async (_result, variables) => {
      await queryClient.invalidateQueries({ queryKey: [USERS_QUERY_KEY] });
      toast.success(`${variables.userIds.length} users updated`);
    },
  });
}
