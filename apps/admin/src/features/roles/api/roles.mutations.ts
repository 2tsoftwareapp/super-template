"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type { RoleForm } from "../model/roles.schemas";

import { createRole, deleteRole, updateRole } from "./roles.api";
import { rolesKeys } from "./roles.query-keys";

interface ApiError {
  error?: { message?: string };
  message?: string;
}

function extractErrorMessage(err: unknown): string | null {
  const apiErr = err as ApiError;
  return apiErr?.error?.message ?? apiErr?.message ?? null;
}

export function useDeleteRoleMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteRole,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: rolesKeys.all });
      toast.success("Role deleted");
    },
    onError: (err) => {
      const msg = extractErrorMessage(err);
      toast.error(msg ?? "Could not delete role");
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
      await queryClient.invalidateQueries({ queryKey: rolesKeys.all });
      toast.success(isEditing ? "Role updated" : "Role created");
      options?.onSuccess?.();
    },
    onError: (err, variables) => {
      const isEditing = !!variables.roleId;
      const msg = extractErrorMessage(err);
      toast.error(
        msg ?? (isEditing ? "Could not update role" : "Could not create role"),
      );
    },
  });
}
