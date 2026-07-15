"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import type { AdminUserDto } from "@/lib/api-types";

import { filterRolesForOrganization } from "@/lib/roles";

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

function findPlatformUserRoleId(options: RoleOption[]): string {
  return options.find(
    (r) => r.name === "USER" && r.organizationId == null,
  )?.id ?? options[0]?.id ?? "";
}

export function useUserRoles(
  userId: string | undefined,
  currentUser: AdminUserDto | null,
  replaceRoles: {
    isPending: boolean;
    isSuccess: boolean;
    isError: boolean;
    mutateAsync: (args: { roleId: string; organizationId?: string }) => Promise<unknown>;
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
  const [selectedOrganizationId, setSelectedOrganizationId] =
    useState<string>("");
  const [selectedRoleId, setSelectedRoleId] = useState<string>("");

  const effectiveOrgId = isActorSuperAdmin
    ? selectedOrganizationId
    : (actorOrganizationId ?? "");

  const filteredOptions = useMemo(
    () => filterRolesForOrganization(options, effectiveOrgId),
    [options, effectiveOrgId],
  );

  useEffect(() => {
    const initialId = initialOrganizationId ?? "";
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedOrganizationId(initialId);
  }, [userId]);

  const currentAssignment = useMemo(
    () => currentUser?.roleAssignments?.find(
      (a) => a.organizationId === selectedOrganizationId,
    ),
    [currentUser, selectedOrganizationId],
  );

  const memberOrganizationIds = currentUser?.memberOrganizationIds ?? [];
  const membershipExists = memberOrganizationIds.includes(
    selectedOrganizationId,
  ) || currentAssignment !== undefined;
  const currentRoleId = currentAssignment?.roleId ?? null;

  useEffect(() => {
    if (currentRoleId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedRoleId(currentRoleId);
    } else {
      // No org-scoped role assignment — default to platform USER
      // This ensures demote-to-USER shows USER, not a leftover custom role
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedRoleId(findPlatformUserRoleId(filteredOptions));
    }
  }, [currentRoleId, filteredOptions]); // eslint-disable-line react-hooks/exhaustive-deps

  const isOrgScopedRole = (role: string) =>
    role === "ADMIN" || (role !== "USER" && role !== "SUPER_ADMIN");

  const selectedRoleName = filteredOptions.find(
    (r) => r.id === selectedRoleId,
  )?.name ?? "USER";

  const isCurrentRoleOrgScoped = isOrgScopedRole(selectedRoleName);
  const needsOrganization = isCurrentRoleOrgScoped;

  const orgRequired = isCurrentRoleOrgScoped;

  const canSave =
    !disabled &&
    (membershipExists
      ? selectedRoleId !== currentRoleId
      : Boolean(effectiveOrgId) || !orgRequired);

  const handleSave = useCallback(() => {
    const args: { roleId: string; organizationId?: string } = {
      roleId: selectedRoleId,
    };
    if (effectiveOrgId) {
      args.organizationId = effectiveOrgId;
    }
    void replaceRoles.mutateAsync(args);
  }, [selectedRoleId, effectiveOrgId, replaceRoles]);

  return {
    isLoading: rolesLoading,
    options: filteredOptions,
    selectedRoleName,
    selectedRoleId,
    onSelect: setSelectedRoleId,
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
    membershipExists,
  };
}
