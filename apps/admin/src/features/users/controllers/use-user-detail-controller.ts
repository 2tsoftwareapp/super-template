"use client";

import { standardSchemaResolver as zodResolver } from "@hookform/resolvers/standard-schema";
import { getErrorMessage } from "@repo/web-utils/errors";
import { internalPath, parseRouteParams } from "@repo/web-utils/params";
import { notFound, useParams, useSearchParams } from "next/navigation";
import { type FormEvent, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import type { UserDetailViewModel } from "@/features/users/model/users.types";

import {
  useDeleteUserMutation,
  useReplaceRolesMutation,
  useUpdateProfileMutation,
  useUpdateStatusMutation,
} from "@/features/users/api/users.mutations";
import { useAdminUserQuery } from "@/features/users/api/users.queries";
import {
  type ProfileForm,
  profileSchema,
  userRouteParamsSchema,
} from "@/features/users/model/users.schemas";
import { useMyOrganizationsQuery } from "@/hooks/use-organizations-lookup";
import { useRolesQuery } from "@/hooks/use-roles-lookup";
import { useSession } from "@/hooks/use-session";
import { useRouter } from "@/i18n/navigation";
import { getAssignableRoles } from "@/lib/roles";

import { useUserRoles } from "./use-user-roles";
import { useUserStatus } from "./use-user-status";

export type { UserDetailViewModel };

/**
 * Orchestration hook for the user detail screen.
 *
 * Flow:
 *   1. Parse route UUID; load user, roles catalog, and actor orgs in parallel.
 *   2. Session + target roles → edit flags (self / privileged target guards).
 *   3. Profile, status, role assignment, and delete mutations with toast on error.
 * Owns: detail query, profile/roles/status/delete orchestration.
 * Does not own: detail section presentational cards.
 */
export function useUserDetailController(): UserDetailViewModel {
  const params = useParams<{ id: string }>();
  const parsedId = parseRouteParams(userRouteParamsSchema, params);
  if (!parsedId.ok) {
    notFound();
  }
  const userId = parsedId.data.id;
  const router = useRouter();
  const session = useSession();
  const searchParams = useSearchParams();

  // `returnTo` is caller-supplied: validate it as an internal path so it cannot
  // be turned into an off-site redirect (see CODING_RULES.md §20).
  const backHref = internalPath(searchParams.get("returnTo"), "/users");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const user = useAdminUserQuery(userId);
  const roles = useRolesQuery();
  const organizations = useMyOrganizationsQuery();
  const currentUser = user.data?.data ?? null;

  const actorRoles = session.data?.data.user.roles ?? [];
  const actorOrganizationId = session.data?.data.organizationId;
  const isActorSuperAdmin = actorRoles.includes("SUPER_ADMIN");
  const isSelf = session.data?.data.user.id === currentUser?.id;
  const isTargetPrivileged = Boolean(
    currentUser?.roles?.some((r) => r === "SUPER_ADMIN" || r === "ADMIN"),
  );
  const canEdit = isActorSuperAdmin || !isTargetPrivileged;

  const updateProfile = useUpdateProfileMutation(userId);
  const updateStatus = useUpdateStatusMutation(userId);
  const replaceRoles = useReplaceRolesMutation(userId);
  const deleteUser = useDeleteUserMutation(userId, {
    onSuccess: () => router.replace("/users"),
  });

  const form = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    values: {
      email: currentUser?.email ?? "",
      displayName: currentUser?.displayName ?? "",
    },
  });

  const assignableRoles = getAssignableRoles(
    actorRoles,
    roles.data?.data ?? [],
  ).map((r) => ({
    id: r.id,
    name: r.name,
    description: r.description,
    organizationId: r.organizationId,
    scope: r.scope,
  }));
  const orgScopedAssignments = currentUser?.roleAssignments?.filter(
    (a) => a.organizationId !== null,
  ) ?? [];
  const primaryOrgAssignment = orgScopedAssignments[0];
  const initialOrgId = isActorSuperAdmin
    ? primaryOrgAssignment?.organizationId
    : (actorOrganizationId ?? null);
  const statusDisabled = isSelf || !canEdit || updateStatus.isPending;
  const roleDisabled = isSelf || !canEdit || replaceRoles.isPending;

  const status = useUserStatus(
    currentUser?.status,
    updateStatus,
    statusDisabled,
  );

  const userRoles = useUserRoles(
    userId,
    currentUser,
    replaceRoles,
    isActorSuperAdmin,
    actorOrganizationId,
    roleDisabled,
    roles.isLoading,
    assignableRoles,
    organizations.data?.data ?? [],
    organizations.isLoading,
    initialOrgId,
  );

  return {
    isLoading: user.isLoading,
    currentUser,
    backHref,
    onRefresh: () => void user.refetch(),
    isRefreshing: user.isFetching,
    flags: { isSelf, isActorSuperAdmin, isTargetPrivileged, canEdit },
    profile: {
      form,
      onSubmit: (event: FormEvent<HTMLFormElement>) => {
        void form.handleSubmit((values) => {
          updateProfile.mutate(values, {
            onError: (error) => {
              toast.error(getErrorMessage(error));
            },
          });
        })(event);
      },
      state: {
        isPending: updateProfile.isPending,
        isSuccess: updateProfile.isSuccess,
        isError: updateProfile.isError,
      },
    },
    status,
    roles: userRoles,
    danger: {
      confirmOpen: confirmDelete,
      onOpen: () => setConfirmDelete(true),
      onCancel: () => setConfirmDelete(false),
      onConfirm: async () => {
        try {
          await deleteUser.mutateAsync();
          setConfirmDelete(false);
        } catch (error) {
          toast.error(getErrorMessage(error));
        }
      },
      state: {
        isPending: deleteUser.isPending,
        isSuccess: deleteUser.isSuccess,
        isError: deleteUser.isError,
      },
      onRetry: () => {
        deleteUser.mutate(undefined, {
          onError: (error) => {
            toast.error(getErrorMessage(error));
          },
        });
      },
    },
  };
}
