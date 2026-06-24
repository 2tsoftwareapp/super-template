"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type {
  AdminUserDto,
  ListResponse,
  UpdateUserStatusInput,
} from "@/lib/api-types";

import { ApiClientError } from "@/lib/http";
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

export function useUpdateUsersStatusMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userIds,
      status,
    }: {
      userIds: string[];
      status: UpdateUserStatusInput["status"];
    }) => {
      const results = await Promise.allSettled(
        userIds.map((userId) =>
          webFetch<{ data: AdminUserDto }>(
            `/api/bff/admin/users/${userId}/status`,
            {
              method: "PATCH",
              body: JSON.stringify({ status } satisfies UpdateUserStatusInput),
            },
          ),
        ),
      );

      const succeeded = results.filter(
        (r) => r.status === "fulfilled",
      ).length;
      const failed = results.filter((r) => r.status === "rejected").length;

      if (failed > 0 && succeeded === 0) {
        const first = results.find(
          (r) => r.status === "rejected",
        )!;
        throw first.reason;
      }

      return { succeeded, failed, total: userIds.length };
    },
    onSuccess: async ({ succeeded, failed, total }) => {
      await queryClient.invalidateQueries({ queryKey: [USERS_QUERY_KEY] });
      if (failed > 0) {
        toast.error(`${failed} of ${total} failed`);
      } else {
        toast.success(`${succeeded} user${succeeded > 1 ? "s" : ""} updated`);
      }
    },
    onError: (error) => {
      const message =
        error instanceof ApiClientError
          ? error.message
          : "Could not update user status";
      toast.error(message);
    },
  });
}
