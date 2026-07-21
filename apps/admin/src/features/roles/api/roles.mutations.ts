"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { RoleForm } from "../model/roles.schemas";

import { rolesApi } from "./roles.api";
import { rolesKeys } from "./roles.query-keys";

export function useDeleteRoleMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (roleId: string) => rolesApi.delete(roleId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: rolesKeys.all });
    },
  });
}

export function useSaveRoleMutation(options?: { onSuccess?: () => void }) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      roleId,
      input,
    }: {
      roleId?: string | undefined;
      input: RoleForm;
    }) => {
      if (roleId) {
        return rolesApi.update(roleId, input);
      }
      return rolesApi.create(input);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: rolesKeys.all });
      options?.onSuccess?.();
    },
  });
}
