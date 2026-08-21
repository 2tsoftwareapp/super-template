"use client";

import { getErrorMessage } from "@repo/web-utils/errors";
import { useState } from "react";
import { toast } from "sonner";

import type { EditableRole, ManagedRoleDto, RoleForm } from "@/features/roles/model/roles.schemas";

import { useDeleteRoleMutation, useSaveRoleMutation } from "@/features/roles/api/roles.mutations";
import { optionalText } from "@/features/roles/model/roles.filtering";

interface UseRolesCrudOptions {
  isSuperAdmin: boolean;
}

/**
 * Save/delete orchestration for the roles screen: drawer state (open,
 * editing role), delete-confirm target, and the two mutations with their
 * toasts. Extracted from useRolesController.
 */
export function useRolesCrud({ isSuperAdmin }: UseRolesCrudOptions) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<EditableRole | null>(null);
  const [deletingRole, setDeletingRole] = useState<ManagedRoleDto | null>(null);
  const [selectedOrganizationId, setSelectedOrganizationId] = useState("");

  const deleteRole = useDeleteRoleMutation();
  const saveRole = useSaveRoleMutation({
    onSuccess: () => {
      setDrawerOpen(false);
    },
  });

  const handleSaveRole = (values: {
    name: string;
    description: string;
    permissionIds: string[];
    organizationId: string;
  }) => {
    const input: RoleForm = {
      name: values.name,
      permissionIds: values.permissionIds,
    };

    if (values.description) {
      input.description = values.description;
    }

    if (isSuperAdmin && !editingRole && values.organizationId) {
      input.organizationId = values.organizationId;
    }

    saveRole.mutate(
      { roleId: editingRole?.id, input },
      {
        onError: (error) => {
          toast.error(getErrorMessage(error));
        },
      },
    );
  };

  const handleDeleteConfirm = async () => {
    if (!deletingRole) {
      return;
    }
    try {
      await deleteRole.mutateAsync(deletingRole.id);
      setDeletingRole(null);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const openCreateDrawer = () => {
    setEditingRole(null);
    if (isSuperAdmin) {
      setSelectedOrganizationId("");
    }
    setDrawerOpen(true);
  };

  const openEditDrawer = (role: ManagedRoleDto) => {
    setEditingRole({
      id: role.id,
      name: role.name,
      description: optionalText(role.description) || null,
      permissions: role.permissions,
      organizationId: role.organizationId,
    });
    setSelectedOrganizationId("");
    setDrawerOpen(true);
  };

  return {
    drawerOpen,
    editingRole,
    deletingRole,
    selectedOrganizationId,
    setSelectedOrganizationId,
    deleteRole,
    saveRole,
    handleSaveRole,
    handleDeleteConfirm,
    openCreateDrawer,
    openEditDrawer,
    setDrawerOpen,
    setDeletingRole,
  };
}
