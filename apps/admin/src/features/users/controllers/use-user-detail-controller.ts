"use client";

import { standardSchemaResolver as zodResolver } from "@hookform/resolvers/standard-schema";
import { useParams, useSearchParams } from "next/navigation";
import { type FormEvent, useState } from "react";
import { useForm, type UseFormReturn } from "react-hook-form";

import type { AdminUserDto } from "@/lib/api-types";

import { useMyOrganizationsQuery } from "@/features/organizations/api/organizations.queries";
import {
  useDeleteUserMutation,
  useReplaceRolesMutation,
  useUpdateProfileMutation,
  useUpdateStatusMutation,
} from "@/features/users/api/users.mutations";
import {
  useAdminRolesQuery,
  useAdminUserQuery,
} from "@/features/users/api/users.queries";
import {
  type ProfileForm,
  profileSchema,
} from "@/features/users/model/users.schemas";
import { useSession } from "@/hooks/use-session";
import { useRouter } from "@/i18n/navigation";
import { getAssignableRoles } from "@/lib/roles";

import { useUserRoles } from "./use-user-roles";
import { useUserStatus } from "./use-user-status";

interface MutationState {
  isPending: boolean;
  isSuccess: boolean;
  isError: boolean;
}

export interface UserDetailViewModel {
  isLoading: boolean;
  currentUser: AdminUserDto | null;
  backHref: string;
  onRefresh: () => void;
  isRefreshing: boolean;
  flags: {
    isSelf: boolean;
    isActorSuperAdmin: boolean;
    isTargetPrivileged: boolean;
    canEdit: boolean;
  };
  profile: {
    form: UseFormReturn<ProfileForm>;
    onSubmit: (event: FormEvent<HTMLFormElement>) => void;
    state: MutationState;
  };
  status: ReturnType<typeof useUserStatus>;
  roles: ReturnType<typeof useUserRoles>;
  danger: {
    confirmOpen: boolean;
    onOpen: () => void;
    onCancel: () => void;
    onConfirm: () => Promise<void>;
    state: MutationState;
    onRetry: () => void;
  };
}

export function useUserDetailController(): UserDetailViewModel {
  const params = useParams<{ id: string }>();
  const userId = params.id;
  const router = useRouter();
  const session = useSession();
  const searchParams = useSearchParams();

  const backHref = searchParams.get("returnTo") ?? "/users";
  const [confirmDelete, setConfirmDelete] = useState(false);

  const user = useAdminUserQuery(userId);
  const roles = useAdminRolesQuery();
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
  ).map((r) => ({ name: r.name, description: r.description }));
  const primaryRole = currentUser?.roles.includes("ADMIN") ? "ADMIN" : "USER";
  const primaryRoleAssignment = currentUser?.roleAssignments?.find(
    (a) => a.roleName === primaryRole && a.organizationId !== null,
  );
  const statusDisabled = isSelf || !canEdit || updateStatus.isPending;
  const roleDisabled = isSelf || !canEdit || replaceRoles.isPending;

  const status = useUserStatus(
    currentUser?.status,
    updateStatus,
    statusDisabled,
  );

  const userRoles = useUserRoles(
    primaryRole,
    replaceRoles,
    isActorSuperAdmin,
    actorOrganizationId,
    roleDisabled,
    roles.isLoading,
    assignableRoles,
    organizations.data?.data ?? [],
    organizations.isLoading,
    primaryRoleAssignment?.organizationId,
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
      onSubmit: (event) => {
        void form.handleSubmit((values) => {
          void updateProfile.mutateAsync(values);
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
        await deleteUser.mutateAsync();
        setConfirmDelete(false);
      },
      state: {
        isPending: deleteUser.isPending,
        isSuccess: deleteUser.isSuccess,
        isError: deleteUser.isError,
      },
      onRetry: () => void deleteUser.mutateAsync(),
    },
  };
}
