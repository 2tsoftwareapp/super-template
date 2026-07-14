"use client";

import { standardSchemaResolver as zodResolver } from "@hookform/resolvers/standard-schema";
import { useParams, useSearchParams } from "next/navigation";
import { type FormEvent, useEffect, useState } from "react";
import { useForm, type UseFormReturn } from "react-hook-form";

import type { AdminUserDto } from "@/lib/api-types";

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

const STATUS_OPTIONS = ["PENDING", "ACTIVE", "BLOCKED"] as const;
export type UserStatus = (typeof STATUS_OPTIONS)[number];
const EMPTY_ROLES: string[] = [];

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
  status: {
    options: readonly UserStatus[];
    selected: UserStatus;
    onSelect: (status: UserStatus) => void;
    disabled: boolean;
    canApply: boolean;
    onApply: () => void;
    state: MutationState;
  };
  roles: {
    isLoading: boolean;
    selected: "ADMIN" | "USER";
    onSelect: (role: "ADMIN" | "USER") => void;
    disabled: boolean;
    canSave: boolean;
    onSave: () => void;
    state: MutationState;
  };
  danger: {
    confirmOpen: boolean;
    onOpen: () => void;
    onCancel: () => void;
    onConfirm: () => Promise<void>;
    state: MutationState;
    onRetry: () => void;
  };
}

/**
 * Orchestration hook for the user detail screen: route params, session, user +
 * roles queries, profile form, status/role selection, and the profile/status/
 * role/delete mutations with their derived permissions. Returns a view model
 * consumed by the presentational UserDetailContent.
 */
export function useUserDetailController(): UserDetailViewModel {
  const params = useParams<{ id: string }>();
  const userId = params.id;
  const router = useRouter();
  const session = useSession();
  const searchParams = useSearchParams();

  const backHref = searchParams.get("returnTo") ?? "/users";
  const [selectedStatus, setSelectedStatus] = useState<UserStatus>("PENDING");
  const [selectedRole, setSelectedRole] = useState<"ADMIN" | "USER">("USER");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const user = useAdminUserQuery(userId);
  const roles = useAdminRolesQuery();
  const currentUser = user.data?.data ?? null;

  const actorId = session.data?.data.user.id;
  const actorRoles = session.data?.data.user.roles ?? EMPTY_ROLES;
  const actorOrganizationId = session.data?.data.organizationId;
  const isActorSuperAdmin = actorRoles.includes("SUPER_ADMIN");
  const isSelf = actorId === currentUser?.id;
  const isTargetPrivileged = Boolean(
    currentUser?.roles?.some((r) => r === "SUPER_ADMIN" || r === "ADMIN"),
  );
  const canEdit =
    isActorSuperAdmin || !isTargetPrivileged || isActorSuperAdmin;

  useEffect(() => {
    if (currentUser) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sync editable fields when user loads
      setSelectedStatus(currentUser.status);
      setSelectedRole(currentUser.roles.includes("ADMIN") ? "ADMIN" : "USER");
    }
  }, [currentUser]);

  const updateProfile = useUpdateProfileMutation(userId);
  const updateStatus = useUpdateStatusMutation(userId);
  const replaceRoles = useReplaceRolesMutation(userId);
  const deleteUser = useDeleteUserMutation(userId, {
    onSuccess: () => {
      router.replace("/users");
    },
  });

  const form = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    values: {
      email: currentUser?.email ?? "",
      displayName: currentUser?.displayName ?? "",
    },
  });

  const primaryRole = currentUser?.roles.includes("ADMIN") ? "ADMIN" : "USER";
  const statusDisabled = isSelf || !canEdit || updateStatus.isPending;
  const roleDisabled = isSelf || !canEdit || replaceRoles.isPending;

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
    status: {
      options: STATUS_OPTIONS,
      selected: selectedStatus,
      onSelect: setSelectedStatus,
      disabled: statusDisabled,
      canApply: !statusDisabled && selectedStatus !== currentUser?.status,
      onApply: () => void updateStatus.mutateAsync(selectedStatus),
      state: {
        isPending: updateStatus.isPending,
        isSuccess: updateStatus.isSuccess,
        isError: updateStatus.isError,
      },
    },
    roles: {
      isLoading: roles.isLoading,
      selected: selectedRole,
      onSelect: setSelectedRole,
      disabled: roleDisabled,
      canSave: !roleDisabled && selectedRole !== primaryRole,
      onSave: () => {
        const args: { role: "ADMIN" | "USER"; organizationId?: string } = { role: selectedRole };
        if (!isActorSuperAdmin && actorOrganizationId) {
          args.organizationId = actorOrganizationId;
        }
        void replaceRoles.mutateAsync(args);
      },
      state: {
        isPending: replaceRoles.isPending,
        isSuccess: replaceRoles.isSuccess,
        isError: replaceRoles.isError,
      },
    },
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
