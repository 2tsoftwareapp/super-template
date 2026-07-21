"use client";

import { getErrorMessage } from "@repo/web-utils/errors";
import { internalPath, parseRouteParams } from "@repo/web-utils/params";
import { useQueryClient } from "@tanstack/react-query";
import { notFound, useParams, useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import type { OrganizationDetailViewModel } from "@/features/organizations/model/organizations.types";

import {
  useDeleteOrganizationMutation,
  useLeaveOrganizationMutation,
  useRemoveMemberMutation,
  useUpdateMemberRoleMutation,
  useUpdateOrganizationMutation,
} from "@/features/organizations/api/organizations.mutations";
import {
  useOrganizationDetailQuery,
  useOrganizationMembersQuery,
} from "@/features/organizations/api/organizations.queries";
import { organizationsKeys } from "@/features/organizations/api/organizations.query-keys";
import {
  canDeleteOrganization,
  canDemoteAdminToMember,
  canDemoteOwnerToAdmin,
  canLeaveOrganization,
  canManageMember,
  canPromoteAdminToOwner,
  canRenameOrganization,
  isLastOwner,
  selectOrganizationActorContext,
} from "@/features/organizations/model/organizations.permissions";
import {
  type CreateOrganizationForm,
  organizationRouteParamsSchema,
} from "@/features/organizations/model/organizations.schemas";
import { useSession } from "@/hooks/use-session";
import { useRouter } from "@/i18n/navigation";

export type { OrganizationDetailViewModel };

/**
 * Orchestration hook for the organization detail screen.
 *
 * Flow:
 *   1. Parse route UUID; load detail + members in parallel.
 *   2. Session + members → org-scoped permission booleans.
 *   3. Rename/delete/leave/member mutations with toast on error.
 */
export function useOrganizationDetailController(): OrganizationDetailViewModel {
  const params = useParams<{ id: string }>();
  const parsedId = parseRouteParams(organizationRouteParamsSchema, params);
  if (!parsedId.ok) {
    notFound();
  }
  const orgId = parsedId.data.id;
  const router = useRouter();
  const queryClient = useQueryClient();
  const session = useSession();
  const searchParams = useSearchParams();

  const backHref = internalPath(searchParams.get("returnTo"), "/organizations");

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);

  const detailQuery = useOrganizationDetailQuery(orgId);
  const membersQuery = useOrganizationMembersQuery(orgId);

  const updateOrg = useUpdateOrganizationMutation(orgId);
  const deleteOrg = useDeleteOrganizationMutation(orgId);
  const leaveOrg = useLeaveOrganizationMutation(orgId);
  const updateMemberRole = useUpdateMemberRoleMutation(orgId);
  const removeMember = useRemoveMemberMutation(orgId);

  const org = detailQuery.data?.data ?? null;
  const members = membersQuery.data?.data ?? [];

  const actorUserId = session.data?.data.user.id;
  const actorRoles = session.data?.data.user.roles ?? [];
  const actorContext = selectOrganizationActorContext(
    actorUserId,
    actorRoles,
    members,
  );

  const handleRetry = () => {
    void queryClient.invalidateQueries({
      queryKey: organizationsKeys.detail(orgId),
    });
    void queryClient.invalidateQueries({
      queryKey: organizationsKeys.members(orgId),
    });
  };

  const handleRetryMembers = () => {
    void queryClient.invalidateQueries({
      queryKey: organizationsKeys.members(orgId),
    });
  };

  const handleSave = (values: CreateOrganizationForm) => {
    updateOrg.mutate(
      { name: values.name },
      {
        onSuccess: () => {
          setEditOpen(false);
        },
        onError: (error) => {
          toast.error(getErrorMessage(error));
        },
      },
    );
  };

  const handleDelete = async () => {
    try {
      await deleteOrg.mutateAsync();
      setDeleteOpen(false);
      router.push("/organizations");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleLeave = async () => {
    try {
      await leaveOrg.mutateAsync();
      setLeaveOpen(false);
      router.push("/organizations");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleUpdateRole = (userId: string, role: string) => {
    updateMemberRole.mutate(
      { userId, role },
      {
        onError: (error) => {
          toast.error(getErrorMessage(error));
        },
      },
    );
  };

  const handleRemoveMember = (userId: string) => {
    removeMember.mutate(userId, {
      onError: (error) => {
        toast.error(getErrorMessage(error));
      },
    });
  };

  const lastOwner = isLastOwner(actorContext, members);

  return {
    orgId,
    backHref,
    isLoading: detailQuery.isLoading || membersQuery.isLoading,
    isError: detailQuery.isError,
    onRetry: handleRetry,
    org,
    members,
    membersError: membersQuery.isError,
    onRetryMembers: handleRetryMembers,
    actorUserId,
    canRename: canRenameOrganization(actorContext),
    canDelete: canDeleteOrganization(actorContext),
    canLeave: canLeaveOrganization(actorContext, members),
    isLastOwner: lastOwner,
    canManageMember: (member) => canManageMember(actorContext, member),
    canDemoteAdminToMember: (member) =>
      canDemoteAdminToMember(actorContext, member),
    canPromoteAdminToOwner: (member) =>
      canPromoteAdminToOwner(actorContext, member),
    canDemoteOwnerToAdmin: (member) =>
      canDemoteOwnerToAdmin(actorContext, member),
    editDialog: {
      open: editOpen,
      currentName: org?.name ?? "",
      onOpen: () => setEditOpen(true),
      onClose: () => setEditOpen(false),
      onSave: handleSave,
      isSaving: updateOrg.isPending,
    },
    deleteConfirm: {
      open: deleteOpen,
      onOpen: () => setDeleteOpen(true),
      onCancel: () => setDeleteOpen(false),
      onConfirm: handleDelete,
      isPending: deleteOrg.isPending,
    },
    leaveConfirm: {
      open: leaveOpen,
      onOpen: () => setLeaveOpen(true),
      onCancel: () => setLeaveOpen(false),
      onConfirm: handleLeave,
      isPending: leaveOrg.isPending,
    },
    memberActions: {
      onUpdateRole: handleUpdateRole,
      onRemove: handleRemoveMember,
      isUpdatingRole: updateMemberRole.isPending,
      isRemoving: removeMember.isPending,
    },
  };
}
