"use client";

import { useCallback, useMemo, useState } from "react";

import { useMyOrganizationsQuery } from "@/features/organizations/api/organizations.queries";
import { useCreateUser } from "@/features/users/api/users.mutations";
import { useAdminRolesQuery } from "@/features/users/api/users.queries";
import { filterRolesForOrganization, getAssignableRoles } from "@/lib/roles";

interface UseCreateUserDrawerControllerOptions {
  open: boolean;
  actorRoles: string[];
  actorOrganizationId: string | null | undefined;
  onClose: () => void;
}

export function useCreateUserDrawerController({
  open: _open,
  actorRoles,
  actorOrganizationId,
  onClose,
}: UseCreateUserDrawerControllerOptions) {
  const rolesQuery = useAdminRolesQuery();
  const organizationsQuery = useMyOrganizationsQuery();

  const createUser = useCreateUser({
    onSuccess: () => {
      onClose();
    },
  });

  const isActorSuperAdmin = actorRoles.includes("SUPER_ADMIN");

  const allAssignable = useMemo(
    () => getAssignableRoles(actorRoles, rolesQuery.data?.data ?? []),
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
    (values: {
      email: string;
      password: string;
      displayName: string;
      roleId: string;
    }) => {
      const orgId = isActorSuperAdmin
        ? selectedOrgId
        : actorOrganizationId;
      return createUser.mutateAsync({
        email: values.email,
        password: values.password,
        displayName: values.displayName,
        roleId: values.roleId,
        status: "PENDING",
        ...(orgId ? { organizationId: orgId } : {}),
      });
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
