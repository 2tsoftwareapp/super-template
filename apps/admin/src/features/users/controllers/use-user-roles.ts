"use client";

import { useCallback, useEffect, useState } from "react";

export interface RoleOption {
  id: string;
  name: string;
  description: string | Record<string, never> | null;
  organizationId: string | Record<string, never> | null;
  scope: string;
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
  initialOrganizationId?: string | null,
) {
  const [selectedRole, setSelectedRole] = useState<string>("USER");
  const [selectedOrganizationId, setSelectedOrganizationId] =
    useState<string>("");

  useEffect(() => {
    if (primaryRole) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedRole(primaryRole);
    }
  }, [primaryRole]);

  useEffect(() => {
    if (initialOrganizationId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedOrganizationId(initialOrganizationId);
    }
  }, [initialOrganizationId]);

  const isOrgScopedRole = (role: string) =>
    role === "ADMIN" || (role !== "USER" && role !== "SUPER_ADMIN");

  const isCurrentRoleOrgScoped = isOrgScopedRole(selectedRole);
  const isPrimaryRoleOrgScoped = primaryRole !== undefined && isOrgScopedRole(primaryRole);
  const needsOrganization = isCurrentRoleOrgScoped;

  const effectiveOrganizationId =
    isActorSuperAdmin ? selectedOrganizationId : (actorOrganizationId ?? "");

  const orgRequired = isCurrentRoleOrgScoped || isPrimaryRoleOrgScoped;

  const canSave =
    !disabled &&
    selectedRole !== primaryRole &&
    (!orgRequired || Boolean(effectiveOrganizationId));

  const handleSave = useCallback(() => {
    const args: { role: string; organizationId?: string } = { role: selectedRole };
    if (effectiveOrganizationId) {
      args.organizationId = effectiveOrganizationId;
    }
    void replaceRoles.mutateAsync(args);
  }, [selectedRole, effectiveOrganizationId, replaceRoles]);

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
