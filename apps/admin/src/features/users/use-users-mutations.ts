"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type { AdminUserDto, CreateAdminUserInput } from "@/lib/api-types";

import { useBulkMutation } from "@/hooks/use-bulk-mutation";
import { ApiClientError, webFetch } from "@/lib/http";

import { USERS_QUERY_KEY } from "./model/users-query-keys";

export function useActivateUsers() {
  return useBulkMutation({
    mutationFn: (userId) =>
      webFetch(`/api/bff/admin/users/${userId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: "ACTIVE" }),
      }),
    queryKey: [USERS_QUERY_KEY],
    successMessage: "activated",
  });
}

export function useBlockUsers() {
  return useBulkMutation({
    mutationFn: (userId) =>
      webFetch(`/api/bff/admin/users/${userId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: "BLOCKED" }),
      }),
    queryKey: [USERS_QUERY_KEY],
    successMessage: "blocked",
  });
}

export function useResendVerification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (email: string) =>
      webFetch("/api/bff/auth/resend-verification", {
        method: "POST",
        body: JSON.stringify({ email }),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [USERS_QUERY_KEY] });
      toast.success("Verification email sent");
    },
    onError: (error) => {
      const message =
        error instanceof ApiClientError
          ? error.payload?.error?.message ?? error.message
          : "Failed to resend verification email";
      toast.error(message);
    },
  });
}

export function useCreateUser({ onSuccess }: { onSuccess?: () => void } = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateAdminUserInput) =>
      webFetch<{ data: AdminUserDto }>("/api/bff/admin/users", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [USERS_QUERY_KEY] });
      toast.success("Invite sent");
      onSuccess?.();
    },
  });
}
