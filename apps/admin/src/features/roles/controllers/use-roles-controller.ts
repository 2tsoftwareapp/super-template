"use client";

import { useMemo, useState } from "react";

import { useOrganizationsQuery } from "@/features/organizations";
import {
  useDeleteRoleMutation,
  useSaveRoleMutation,
} from "@/features/roles/api/roles.mutations";
import {
  usePermissionCatalogQuery,
  useRolesQuery,
} from "@/features/roles/api/roles.queries";
import {
  filterRolesBySearch,
  mergeCustomRoles,
  type MergedRole,
  mergeSystemRoles,
  optionalText,
} from "@/features/roles/model/roles.filtering";
import { selectRoleManagementPermissions } from "@/features/roles/model/roles.permissions";
import {
  type EditableRole,
  type ManagedRoleDto,
  type PermissionDto,
  type RoleForm,
} from "@/features/roles/model/roles.schemas";
import { useSession } from "@/hooks/use-session";

export interface RolesViewModel {
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  isSuperAdmin: boolean;
  search: string;
  onSearchChange: (value: string) => void;
  isLoading: boolean;
  isRefreshing: boolean;
  hasError: boolean;
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
    permissionsError: boolean;
    isSaving: boolean;
    onCreate: () => void;
    onClose: () => void;
    onSave: (values: {
      name: string;
      description: string;
      permissionIds: string[];
      organizationId: string;
    }) => void;
  };
  confirmDelete: {
    role: ManagedRoleDto | null;
    onCancel: () => void;
    onConfirm: () => Promise<void>;
  };
  organizations: {
    items: { id: string; name: string }[];
    loading: boolean;
    selectedId: string;
    onSelect: (id: string) => void;
  };
  organizationNames: Record<string, string>;
  actorPermissions: string[];
}

export function useRolesController(): RolesViewModel {
  const session = useSession();
  const sessionData = session.data?.data;
  const permissions = sessionData?.permissions ?? [];
  const userRoles = sessionData?.user?.roles ?? [];
  const isSuperAdmin = userRoles.includes("SUPER_ADMIN");

  const { canCreate, canUpdate, canDelete } =
    selectRoleManagementPermissions(permissions);

  const [search, setSearch] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<EditableRole | null>(null);
  const [deletingRole, setDeletingRole] = useState<ManagedRoleDto | null>(null);
  const [selectedOrganizationId, setSelectedOrganizationId] = useState("");

  const roles = useRolesQuery();
  const permissionCatalog = usePermissionCatalogQuery();
  const deleteRole = useDeleteRoleMutation();
  const saveRole = useSaveRoleMutation({
    onSuccess: () => {
      setDrawerOpen(false);
    },
  });
  const organizations = useOrganizationsQuery({
    enabled: isSuperAdmin,
  });

  const { systemRoles, customRoles } = useMemo(() => {
    const all = roles.data?.data ?? [];
    return {
      systemRoles: mergeSystemRoles(all.filter((role) => role.isSystem)),
      customRoles: mergeCustomRoles(all.filter((role) => !role.isSystem)),
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

    saveRole.mutate({ roleId: editingRole?.id, input });
  };

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

  const anyRoles = systemRoles.length > 0 || customRoles.length > 0;
  const noResults =
    Boolean(search) &&
    filteredSystem.length === 0 &&
    filteredCustom.length === 0;

  const hasError = roles.isError || permissionCatalog.isError;

  return {
    canCreate,
    canUpdate,
    canDelete,
    isSuperAdmin,
    search,
    onSearchChange: setSearch,
    isLoading: roles.isLoading,
    isRefreshing: roles.isFetching || permissionCatalog.isFetching,
    hasError,
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
      permissionsError: permissionCatalog.isError,
      isSaving: saveRole.isPending,
      onCreate: openCreateDrawer,
      onClose: () => setDrawerOpen(false),
      onSave: handleSaveRole,
    },
    confirmDelete: {
      role: deletingRole,
      onCancel: () => setDeletingRole(null),
      onConfirm: handleDeleteConfirm,
    },
    organizations: {
      items: organizations.data?.data ?? [],
      loading: organizations.isLoading,
      selectedId: selectedOrganizationId,
      onSelect: setSelectedOrganizationId,
    },
    organizationNames: Object.fromEntries(
      (organizations.data?.data ?? []).map((org) => [org.id, org.name]),
    ),
    actorPermissions: permissions,
  };
}
