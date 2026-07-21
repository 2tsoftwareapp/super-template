"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { RoleForm } from "../model/roles.schemas";

import { createRole, deleteRole, updateRole } from "./roles.api";
import { rolesKeys } from "./roles.query-keys";

export function useDeleteRoleMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteRole,
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
        return updateRole(roleId, input);
      }
      return createRole(input);
    },
    onSuccess: async (data, variables) => {
      await queryClient.invalidateQueries({ queryKey: rolesKeys.all });
      options?.onSuccess?.();
    },
  });
}
