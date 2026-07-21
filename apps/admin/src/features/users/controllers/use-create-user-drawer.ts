"use client";

import { getErrorMessage } from "@repo/web-utils/errors";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";

import type { RoleDto } from "@/lib/api-types";

import { useMyOrganizationsQuery } from "@/features/organizations";
import { useRolesQuery } from "@/features/roles";
import { useCreateUser } from "@/features/users/api/users.mutations";
import { filterRolesForOrganization, getAssignableRoles } from "@/lib/roles";

interface UseCreateUserDrawerOptions {
  open: boolean;
  actorRoles: string[];
  actorOrganizationId: string | null | undefined;
  onClose: () => void;
}

export function useCreateUserDrawer({
  open: _open,
  actorRoles,
  actorOrganizationId,
  onClose,
}: UseCreateUserDrawerOptions) {
  const rolesQuery = useRolesQuery();
  const organizationsQuery = useMyOrganizationsQuery();

  const createUser = useCreateUser({
    onSuccess: () => {
      onClose();
    },
  });

  const isActorSuperAdmin = actorRoles.includes("SUPER_ADMIN");

  const allAssignable = useMemo(
    () =>
      getAssignableRoles(
        actorRoles,
        (rolesQuery.data?.data ?? []) as RoleDto[],
      ),
    [actorRoles, rolesQuery.data],
  );

  const [selectedOrgId, setSelectedOrgId] = useState<string>("");

  const effectiveOrgId = isActorSuperAdmin
    ? selectedOrgId
    : (actorOrganizationId ?? "");

  const rolesForOrg = useMemo(
    () => filterRolesForOrganization(allAssignable, effectiveOrgId),
    [allAssignable, effectiveOrgId],
  );

  const organizations = organizationsQuery.data?.data ?? [];
  const isOrganizationsLoading = organizationsQuery.isLoading;

  const actorOrg = organizationsQuery.data?.data?.find(
    (o) => o.id === actorOrganizationId,
  );

  const handleSubmit = useCallback(
    async (values: {
      email: string;
      password: string;
      displayName: string;
      roleId: string;
    }) => {
      const orgId = isActorSuperAdmin
        ? selectedOrgId
        : actorOrganizationId;
      try {
        return await createUser.mutateAsync({
          email: values.email,
          password: values.password,
          displayName: values.displayName,
          roleId: values.roleId,
          status: "PENDING",
          ...(orgId ? { organizationId: orgId } : {}),
        });
      } catch (error) {
        toast.error(getErrorMessage(error));
        throw error;
      }
    },
    [createUser, isActorSuperAdmin, selectedOrgId, actorOrganizationId],
  );

  return {
    allRoles: rolesQuery.data?.data ?? [],
    allAssignable,
    organizations,
    isOrganizationsLoading,
    actorOrg,
    selectedOrgId,
    setSelectedOrgId,
    rolesForOrg,
    isActorSuperAdmin,
    isSaving: createUser.isPending,
    isError: createUser.isError,
    onSubmit: handleSubmit,
  };
}
