"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";

import type { RolesListParams } from "@/features/roles/api/roles.api";
import type { RolesViewModel } from "@/features/roles/model/roles.types";

import { usePermissionCatalogQuery } from "@/features/roles/api/roles.queries";
import { rolesKeys } from "@/features/roles/api/roles.query-keys";
import {
  filterRolesBySearch,
  mergeCustomRoles,
  mergeSystemRoles,
} from "@/features/roles/model/roles.filtering";
import { selectRoleManagementPermissions } from "@/features/roles/model/roles.permissions";
import { useOrganizationsQuery } from "@/hooks/use-organizations-lookup";
import { useRolesQuery } from "@/hooks/use-roles-lookup";
import { useSession } from "@/hooks/use-session";

import { useRolesCrud } from "./use-roles-crud";
import { useRolesUrlState } from "./use-roles-url-state";

export type { RolesViewModel };

export function useRolesController(): RolesViewModel {
  const queryClient = useQueryClient();
  const session = useSession();
  const sessionData = session.data?.data;
  const permissions = sessionData?.permissions ?? [];
  const { canCreate, canUpdate, canDelete, isSuperAdmin } = selectRoleManagementPermissions(
    permissions,
    sessionData?.user?.roles,
  );

  const { urlPage, searchInput, debouncedSearch, urlScope, urlOrgId, setSearchInput, patchParams } =
    useRolesUrlState();

  const {
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
  } = useRolesCrud({ isSuperAdmin });

  const queryParams = useMemo(() => {
    const params: RolesListParams = { page: urlPage, limit: 50 };
    if (debouncedSearch) params.search = debouncedSearch;
    if (urlScope) params.scope = urlScope;
    if (urlOrgId) params.organizationId = urlOrgId;
    return params;
  }, [urlPage, debouncedSearch, urlScope, urlOrgId]);

  const roles = useRolesQuery(queryParams);
  const permissionCatalog = usePermissionCatalogQuery();
  const organizations = useOrganizationsQuery({
    enabled: isSuperAdmin,
  });

  const meta = roles.data?.meta;

  const { systemRoles, customRoles } = useMemo(() => {
    const all = roles.data?.data ?? [];
    return {
      systemRoles: mergeSystemRoles(all.filter((role) => role.isSystem)),
      customRoles: mergeCustomRoles(all.filter((role) => !role.isSystem)),
    };
  }, [roles.data?.data]);

  const filteredSystem = useMemo(
    () => filterRolesBySearch(systemRoles, searchInput),
    [systemRoles, searchInput],
  );
  const filteredCustom = useMemo(
    () => filterRolesBySearch(customRoles, searchInput),
    [customRoles, searchInput],
  );

  const total = meta?.total ?? 0;
  const totalPages = meta?.totalPages ?? 1;

  const handlePageChange = (page: number) => {
    patchParams({ page: page > 1 ? String(page) : undefined });
  };

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
  };

  const handleScopeFilterChange = (value: "platform" | "organization" | undefined) => {
    patchParams({ scope: value, page: undefined });
  };

  const anyRoles = systemRoles.length > 0 || customRoles.length > 0;
  const noResults =
    Boolean(debouncedSearch) && filteredSystem.length === 0 && filteredCustom.length === 0;

  const isError = roles.isError || permissionCatalog.isError;

  const handleRetry = () => {
    void queryClient.invalidateQueries({ queryKey: rolesKeys.all });
  };

  return {
    canCreate,
    canUpdate,
    canDelete,
    isSuperAdmin,
    search: searchInput,
    onSearchChange: handleSearchChange,
    scopeFilter: urlScope,
    onScopeFilterChange: handleScopeFilterChange,
    organizationFilter: urlOrgId,
    onOrganizationFilterChange: (value) =>
      patchParams({
        organizationId: value === "" ? undefined : value,
        page: undefined,
      }),
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
