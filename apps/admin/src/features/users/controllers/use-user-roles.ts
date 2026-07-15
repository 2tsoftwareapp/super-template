"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import type { AdminUserDto } from "@/lib/api-types";

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
  const [selectedOrganizationId, setSelectedOrganizationId] =
    useState<string>("");
  const [selectedRoleName, setSelectedRoleName] = useState<string>("USER");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedOrganizationId(initialOrganizationId ?? "");
    const current = currentUser?.roleAssignments?.find(
      (a) => a.organizationId === (initialOrganizationId ?? null),
    );
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedRoleName(current?.roleName ?? "USER");
  }, [userId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const current = currentUser?.roleAssignments?.find(
      (a) => a.organizationId === selectedOrganizationId,
    );
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedRoleName(current?.roleName ?? "USER");
  }, [selectedOrganizationId]); // eslint-disable-line react-hooks/exhaustive-deps

  const originalAssignment = useMemo(
    () => currentUser?.roleAssignments?.find(
      (a) => a.organizationId === selectedOrganizationId,
    ),
    [currentUser, selectedOrganizationId],
  );

  const originalRoleName = originalAssignment?.roleName ?? "USER";

  const isOrgScopedRole = (role: string) =>
    role === "ADMIN" || (role !== "USER" && role !== "SUPER_ADMIN");

  const isCurrentRoleOrgScoped = isOrgScopedRole(selectedRoleName);
  const needsOrganization = isCurrentRoleOrgScoped;

  const effectiveOrganizationId =
    isActorSuperAdmin ? selectedOrganizationId : (actorOrganizationId ?? "");

  const orgRequired = isCurrentRoleOrgScoped;

  const filteredOptions = useMemo(() => {
    if (!isActorSuperAdmin) {
      return options;
    }
    return selectedOrganizationId
      ? options.filter(
          (o) => o.organizationId === null || (o.organizationId as unknown as string) === selectedOrganizationId,
        )
      : options.filter((o) => o.organizationId === null);
  }, [options, selectedOrganizationId, isActorSuperAdmin]);

  const canSave =
    !disabled &&
    selectedRoleName !== originalRoleName &&
    (!orgRequired || Boolean(effectiveOrganizationId));

  const selectedRoleId = originalAssignment?.roleId ?? "";

  const handleSave = useCallback(() => {
    const roleOption = options.find((o) => o.name === selectedRoleName);
    const id = roleOption?.id;
    if (!id) return;
    const args: { roleId: string; organizationId?: string } = { roleId: id };
    if (effectiveOrganizationId) {
      args.organizationId = effectiveOrganizationId;
    }
    void replaceRoles.mutateAsync(args);
  }, [selectedRoleName, effectiveOrganizationId, options, replaceRoles]);

  return {
    isLoading: rolesLoading,
    options: filteredOptions,
    selectedRoleName,
    selectedRoleId,
    onSelect: setSelectedRoleName,
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
