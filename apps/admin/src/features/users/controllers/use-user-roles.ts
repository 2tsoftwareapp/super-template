"use client";

import { useCallback, useMemo, useState } from "react";

export interface RoleOption {
  name: string;
  description: string | Record<string, never> | null;
}

export interface OrganizationOption {
  id: string;
  name: string;
}

export function useUserRoles(
  primaryRole: string | undefined,
  replaceRoles: {
    isPending: boolean;
    isSuccess: boolean;
    isError: boolean;
    mutateAsync: (args: { role: string; organizationId?: string }) => Promise<unknown>;
  },
  isActorSuperAdmin: boolean,
  actorOrganizationId: string | null | undefined,
  disabled: boolean,
  rolesLoading: boolean,
  options: RoleOption[],
  organizations: OrganizationOption[],
  organizationsLoading: boolean,
) {
  const [selectedRole, setSelectedRole] = useState<string>(
    primaryRole ?? "USER",
  );

  const defaultOrgId = useMemo(
    () =>
      organizations.length === 1 ? (organizations[0]?.id ?? "") : "",
    [organizations],
  );
  const [selectedOrganizationId, setSelectedOrganizationId] =
    useState<string>(defaultOrgId);

  const isUserRole = selectedRole === "USER";
  const editingOrgScopedRole = !isUserRole;
  const needsOrganization = editingOrgScopedRole;
  const orgRequired = editingOrgScopedRole;

  const canSave =
    !disabled &&
    selectedRole !== primaryRole &&
    (!orgRequired || selectedOrganizationId.length > 0);

  const handleSave = useCallback(() => {
    const args: { role: string; organizationId?: string } = { role: selectedRole };
    if (selectedOrganizationId) {
      args.organizationId = selectedOrganizationId;
    } else if (actorOrganizationId) {
      args.organizationId = actorOrganizationId;
    }
    void replaceRoles.mutateAsync(args);
  }, [selectedRole, selectedOrganizationId, actorOrganizationId, replaceRoles]);

  return {
    isLoading: rolesLoading,
    options,
    selected: selectedRole,
    onSelect: setSelectedRole,
    disabled,
    canSave,
    onSave: handleSave,
    state: {
      isPending: replaceRoles.isPending,
      isSuccess: replaceRoles.isSuccess,
      isError: replaceRoles.isError,
    },
    organizations: isActorSuperAdmin ? organizations : [],
    organizationsLoading,
    selectedOrganizationId,
    onOrganizationSelect: setSelectedOrganizationId,
    needsOrganization,
    orgRequired,
  };
}
