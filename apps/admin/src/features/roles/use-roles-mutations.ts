"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type { RoleForm } from "./roles-schemas";

import { createRole, deleteRole, updateRole } from "./roles-service";
import { ROLES_QUERY_KEY } from "./use-roles-queries";

export function useDeleteRoleMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteRole,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ROLES_QUERY_KEY });
      toast.success("Role deleted");
    },
    onError: () => {
      toast.error("Could not delete role");
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
      const isEditing = !!variables.roleId;
      await queryClient.invalidateQueries({ queryKey: ROLES_QUERY_KEY });
      toast.success(isEditing ? "Role updated" : "Role created");
      options?.onSuccess?.();
    },
    onError: (err, variables) => {
      const isEditing = !!variables.roleId;
      toast.error(
        isEditing ? "Could not update role" : "Could not create role",
      );
    },
  });
}
