"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type { CreateAdminUserInput } from "@/lib/api-types";

import { useBulkMutation } from "@/hooks/use-bulk-mutation";
import { ApiClientError } from "@/lib/http";

import { usersApi } from "./api/users-api";
import { usersKeys } from "./model/users-query-keys";

export function useActivateUsers() {
  return useBulkMutation({
    mutationFn: (userId) => usersApi.updateStatus(userId, "ACTIVE"),
    queryKey: usersKeys.all,
    successMessage: "activated",
  });
}

export function useBlockUsers() {
  return useBulkMutation({
    mutationFn: (userId) => usersApi.updateStatus(userId, "BLOCKED"),
    queryKey: usersKeys.all,
    successMessage: "blocked",
  });
}

export function useResendVerification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (email: string) => usersApi.resendVerification(email),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: usersKeys.all });
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
    mutationFn: (input: CreateAdminUserInput) => usersApi.create(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: usersKeys.all });
      toast.success("Invite sent");
      onSuccess?.();
    },
  });
}
