"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { AdminUserDto, UpdateAdminUserInput } from "@/lib/api-types";

import { usersApi } from "./api/users-api";
import { usersKeys } from "./model/users-query-keys";

export function useUpdateProfileMutation(
  userId: string,
  options?: { onSuccess?: (data: { data: AdminUserDto }) => void },
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateAdminUserInput) =>
      usersApi.updateProfile(userId, input),
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: usersKeys.detail(userId) });
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
      usersApi.updateStatus(userId, status),
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: usersKeys.detail(userId) });
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
      usersApi.replaceRoles(userId, role),
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: usersKeys.detail(userId) });
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
      usersApi.delete(userId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: usersKeys.all });
      await options?.onSuccess?.();
    },
  });
}
