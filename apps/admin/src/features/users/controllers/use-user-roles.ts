"use client";

import { getErrorMessage } from "@repo/web-utils/errors";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import type { AdminUserDto } from "@/lib/api-types";

import { filterRolesForOrganization, findPlatformUserRoleId } from "@/lib/roles";

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
  const [selectedOrganizationId, setSelectedOrganizationId] = useState<string>("");
  const [selectedRoleId, setSelectedRoleId] = useState<string>("");

  const scopeOrganizationId = isActorSuperAdmin
    ? selectedOrganizationId
    : (actorOrganizationId ?? "");

  const filteredOptions = useMemo(
    () => filterRolesForOrganization(options, scopeOrganizationId),
    [options, scopeOrganizationId],
  );

  // Sync the org selector when a new target user loads. Including
  // initialOrganizationId handles async hydration after the first render.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedOrganizationId(initialOrganizationId ?? "");
  }, [userId, initialOrganizationId]);

  const currentAssignment = useMemo(
    () => currentUser?.roleAssignments?.find((a) => a.organizationId === scopeOrganizationId),
    [currentUser, scopeOrganizationId],
  );

  const memberOrganizationIds = currentUser?.memberOrganizationIds ?? [];
  const membershipExists =
    memberOrganizationIds.includes(scopeOrganizationId) || currentAssignment !== undefined;

  const platformUserRoleId = useMemo(
    () => findPlatformUserRoleId(filteredOptions),
    [filteredOptions],
  );

  const effectiveCurrentRoleId =
    currentAssignment?.roleId ?? (membershipExists ? platformUserRoleId : null);
  const defaultRoleId = effectiveCurrentRoleId ?? platformUserRoleId;

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedRoleId(defaultRoleId);
  }, [defaultRoleId]);

  const selectedRoleName = filteredOptions.find((r) => r.id === selectedRoleId)?.name ?? "USER";

  const isCurrentRoleOrgScoped = selectedRoleName !== "USER" && selectedRoleName !== "SUPER_ADMIN";
  const orgRequired = isCurrentRoleOrgScoped;

  const canSave =
    !disabled &&
    Boolean(selectedRoleId) &&
    (membershipExists
      ? selectedRoleId !== effectiveCurrentRoleId
      : Boolean(scopeOrganizationId) || !orgRequired);

  const handleSave = useCallback(async () => {
    const args: { roleId: string; organizationId?: string } = {
      roleId: selectedRoleId,
    };
    if (scopeOrganizationId) {
      args.organizationId = scopeOrganizationId;
    }
    try {
      await replaceRoles.mutateAsync(args);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }, [selectedRoleId, scopeOrganizationId, replaceRoles]);

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
    needsOrganization: orgRequired,
    orgRequired,
    membershipExists,
  };
}
