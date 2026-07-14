"use client";

import { useCallback, useEffect, useState } from "react";

export interface RoleOption {
  name: string;
  description: string | Record<string, never> | null;
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
) {
  const [selectedRole, setSelectedRole] = useState<string>("USER");

  useEffect(() => {
    if (primaryRole) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sync when user data loads
      setSelectedRole(primaryRole);
    }
  }, [primaryRole]);

  const canSave = !disabled && selectedRole !== primaryRole;

  const handleSave = useCallback(() => {
    const args: { role: string; organizationId?: string } = { role: selectedRole };
    if (!isActorSuperAdmin && actorOrganizationId) {
      args.organizationId = actorOrganizationId;
    }
    void replaceRoles.mutateAsync(args);
  }, [selectedRole, isActorSuperAdmin, actorOrganizationId, replaceRoles]);

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
  };
}
