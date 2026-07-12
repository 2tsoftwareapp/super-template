"use client";

import { useMemo, useState } from "react";

import {
  filterRolesBySearch,
  type MergedRole,
  mergeRoles,
  optionalText,
} from "@/features/roles/roles-filtering";
import { selectRoleManagementPermissions } from "@/features/roles/roles-permissions";
import {
  type EditableRole,
  type ManagedRoleDto,
  type PermissionDto,
} from "@/features/roles/roles-schemas";
import { useDeleteRoleMutation } from "@/features/roles/use-roles-mutations";
import {
  usePermissionCatalogQuery,
  useRolesQuery,
} from "@/features/roles/use-roles-queries";
import { useSession } from "@/hooks/use-session";

export interface RolesViewModel {
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  search: string;
  onSearchChange: (value: string) => void;
  isLoading: boolean;
  isRefreshing: boolean;
  onRefresh: () => void;
  systemRoles: MergedRole[];
  customRoles: MergedRole[];
  anyRoles: boolean;
  noResults: boolean;
  deletingRoleId: string | null;
  isDeleting: boolean;
  onEditRole: (role: ManagedRoleDto) => void;
  onRequestDelete: (role: ManagedRoleDto) => void;
  drawer: {
    open: boolean;
    editingRole: EditableRole | null;
    permissions: PermissionDto[];
    onCreate: () => void;
    onClose: () => void;
  };
  confirmDelete: {
    role: ManagedRoleDto | null;
    onCancel: () => void;
    onConfirm: () => Promise<void>;
  };
}

/**
 * Orchestration hook for the roles screen: session/permissions, role +
 * permission-catalog queries, search filtering, drawer and delete-dialog state,
 * and event handlers. Returns a view model consumed by the presentational
 * RolesListView.
 */
export function useRolesController(): RolesViewModel {
  const session = useSession();
  const { canCreate, canUpdate, canDelete } = selectRoleManagementPermissions(
    session.data?.data.permissions,
  );

  const [search, setSearch] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<EditableRole | null>(null);
  const [deletingRole, setDeletingRole] = useState<ManagedRoleDto | null>(null);

  const roles = useRolesQuery();
  const permissionCatalog = usePermissionCatalogQuery();
  const deleteRole = useDeleteRoleMutation();

  const { systemRoles, customRoles } = useMemo(() => {
    const all = roles.data?.data ?? [];
    return {
      systemRoles: mergeRoles(all.filter((role) => role.isSystem)),
      customRoles: mergeRoles(all.filter((role) => !role.isSystem)),
    };
  }, [roles.data?.data]);

  const filteredSystem = useMemo(
    () => filterRolesBySearch(systemRoles, search),
    [systemRoles, search],
  );
  const filteredCustom = useMemo(
    () => filterRolesBySearch(customRoles, search),
    [customRoles, search],
  );

  const handleDeleteConfirm = async () => {
    if (!deletingRole) {
      return;
    }
    try {
      await deleteRole.mutateAsync(deletingRole.id);
    } finally {
      setDeletingRole(null);
    }
  };

  const openCreateDrawer = () => {
    setEditingRole(null);
    setDrawerOpen(true);
  };

  const openEditDrawer = (role: ManagedRoleDto) => {
    setEditingRole({
      id: role.id,
      name: role.name,
      description: optionalText(role.description) || null,
      permissions: role.permissions,
    });
    setDrawerOpen(true);
  };

  const anyRoles = systemRoles.length > 0 || customRoles.length > 0;
  const noResults =
    Boolean(search) &&
    filteredSystem.length === 0 &&
    filteredCustom.length === 0;

  return {
    canCreate,
    canUpdate,
    canDelete,
    search,
    onSearchChange: setSearch,
    isLoading: roles.isLoading,
    isRefreshing: roles.isFetching || permissionCatalog.isFetching,
    onRefresh: () => {
      void roles.refetch();
      void permissionCatalog.refetch();
    },
    systemRoles: filteredSystem,
    customRoles: filteredCustom,
    anyRoles,
    noResults,
    deletingRoleId: deletingRole?.id ?? null,
    isDeleting: deleteRole.isPending,
    onEditRole: openEditDrawer,
    onRequestDelete: setDeletingRole,
    drawer: {
      open: drawerOpen,
      editingRole,
      permissions: permissionCatalog.data?.data ?? [],
      onCreate: openCreateDrawer,
      onClose: () => setDrawerOpen(false),
    },
    confirmDelete: {
      role: deletingRole,
      onCancel: () => setDeletingRole(null),
      onConfirm: handleDeleteConfirm,
    },
  };
}
