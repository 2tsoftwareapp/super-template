"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { AdminUserDto, UpdateAdminUserInput } from "@/lib/api-types";

import { webFetch } from "@/lib/http";

import { USERS_QUERY_KEY } from "./constants";

export function useUpdateProfileMutation(
  userId: string,
  options?: { onSuccess?: (data: { data: AdminUserDto }) => void },
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateAdminUserInput) =>
      webFetch<{ data: AdminUserDto }>(`/api/bff/admin/users/${userId}`, {
        method: "PATCH",
        body: JSON.stringify(input),
      }),
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: ["admin-user", userId] });
      options?.onSuccess?.(data);
    },
  });
}

export function useUpdateStatusMutation(
  userId: string,
  options?: { onSuccess?: (data: { data: AdminUserDto }) => void },
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (status: string) =>
      webFetch<{ data: AdminUserDto }>(
        `/api/bff/admin/users/${userId}/status`,
        { method: "PATCH", body: JSON.stringify({ status }) },
      ),
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: ["admin-user", userId] });
      options?.onSuccess?.(data);
    },
  });
}

export function useReplaceRolesMutation(
  userId: string,
  options?: { onSuccess?: (data: { data: AdminUserDto }) => void },
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (role: "ADMIN" | "USER") =>
      webFetch<{ data: AdminUserDto }>(
        `/api/bff/admin/users/${userId}/roles`,
        { method: "PUT", body: JSON.stringify({ role }) },
      ),
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: ["admin-user", userId] });
      options?.onSuccess?.(data);
    },
  });
}

export function useDeleteUserMutation(
  userId: string,
  options?: { onSuccess?: () => void | Promise<void> },
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      webFetch(`/api/bff/admin/users/${userId}`, { method: "DELETE" }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [USERS_QUERY_KEY] });
      await options?.onSuccess?.();
    },
  });
}
