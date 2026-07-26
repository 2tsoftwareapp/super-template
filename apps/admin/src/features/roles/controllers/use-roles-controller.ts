"use client";

import { getErrorMessage } from "@repo/web-utils/errors";
import { useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import type {
  EditableRole,
  ManagedRoleDto,
  RoleForm,
} from "@/features/roles/model/roles.schemas";
import type { RolesViewModel } from "@/features/roles/model/roles.types";

import { useOrganizationsQuery } from "@/features/organizations";
import {
  useDeleteRoleMutation,
  useSaveRoleMutation,
} from "@/features/roles/api/roles.mutations";
import {
  usePermissionCatalogQuery,
  useRolesQuery,
} from "@/features/roles/api/roles.queries";
import { rolesKeys } from "@/features/roles/api/roles.query-keys";
import {
  filterRolesBySearch,
  mergeCustomRoles,
  mergeSystemRoles,
  optionalText,
} from "@/features/roles/model/roles.filtering";
import { selectRoleManagementPermissions } from "@/features/roles/model/roles.permissions";
import { useSession } from "@/hooks/use-session";
import { usePathname, useRouter, useSearchParams } from "@/i18n/navigation";

export type { RolesViewModel };

export function useRolesController(): RolesViewModel {
  const queryClient = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const session = useSession();
  const sessionData = session.data?.data;
  const permissions = sessionData?.permissions ?? [];
  const { canCreate, canUpdate, canDelete, isSuperAdmin } =
    selectRoleManagementPermissions(
      permissions,
      sessionData?.user?.roles,
    );

  const urlPage = Math.max(1, Number(searchParams.get("page")) || 1);
  const urlSearch = searchParams.get("search") ?? "";
  const urlScope = searchParams.get("scope") ?? undefined;
  const urlOrgId = searchParams.get("organizationId") ?? undefined;

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<EditableRole | null>(null);
  const [deletingRole, setDeletingRole] = useState<ManagedRoleDto | null>(null);
  const [selectedOrganizationId, setSelectedOrganizationId] = useState("");

  const queryParams = useMemo(() => ({
    page: urlPage,
    limit: 50,
    search: urlSearch || undefined,
    scope: urlScope,
    organizationId: urlOrgId || undefined,
  }), [urlPage, urlSearch, urlScope, urlOrgId]);

  const roles = useRolesQuery(queryParams);
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

  const rolesData = roles.data?.data ?? [];
  const meta = roles.data?.meta;

  const { systemRoles, customRoles } = useMemo(() => {
    const all = rolesData;
    return {
      systemRoles: mergeSystemRoles(all.filter((role) => role.isSystem)),
      customRoles: mergeCustomRoles(all.filter((role) => !role.isSystem)),
    };
  }, [rolesData]);

  const filteredSystem = useMemo(
    () => filterRolesBySearch(systemRoles, urlSearch),
    [systemRoles, urlSearch],
  );
  const filteredCustom = useMemo(
    () => filterRolesBySearch(customRoles, urlSearch),
    [customRoles, urlSearch],
  );

  const total = meta?.total ?? 0;
  const totalPages = meta?.totalPages ?? 1;

  const patchParams = (patch: Record<string, string | undefined>) => {
    const next = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(patch)) {
      if (value === undefined || value === "") {
        next.delete(key);
      } else {
        next.set(key, value);
      }
    }
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  };

  const handlePageChange = (page: number) => {
    patchParams({ page: page > 1 ? String(page) : undefined });
  };

  const handleSearchChange = (value: string) => {
    patchParams({ search: value || undefined, page: undefined });
  };

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

  const anyRoles = systemRoles.length > 0 || customRoles.length > 0;
  const noResults =
    Boolean(urlSearch) &&
    filteredSystem.length === 0 &&
    filteredCustom.length === 0;

  const isError = roles.isError || permissionCatalog.isError;

  const handleRetry = () => {
    void queryClient.invalidateQueries({ queryKey: rolesKeys.all });
  };

  return {
    canCreate,
    canUpdate,
    canDelete,
    isSuperAdmin,
    search: urlSearch,
    onSearchChange: handleSearchChange,
    isLoading: roles.isLoading,
    isRefreshing: roles.isFetching || permissionCatalog.isFetching,
    isError,
    onRetry: handleRetry,
    onRefresh: handleRetry,
    systemRoles: filteredSystem,
    customRoles: filteredCustom,
    anyRoles,
    noResults,
    pagination: {
      page: urlPage,
      pageSize: 50,
      totalPages,
      total,
      onPageChange: handlePageChange,
    },
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
