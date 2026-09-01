"use client";

import { Avatar } from "@repo/web-ui/avatar";
import { Badge } from "@repo/web-ui/badge";
import { Button } from "@repo/web-ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/web-ui/card";
import { ConfirmDialog } from "@repo/web-ui/confirm-dialog";
import { Empty, EmptyContent, EmptyHeader, EmptyTitle } from "@repo/web-ui/empty";
import { ErrorState } from "@repo/web-ui/error-state";
import { ResourcePropertyGrid } from "@repo/web-ui/resource-property-grid";
import { Show } from "@repo/web-ui/show";
import { Spinner } from "@repo/web-ui/spinner";
import {
  Building,
  ChevronLeft,
  Crown,
  LogOut,
  Settings,
  Shield,
  Trash2,
  User,
  UserCheck,
  UserCog,
  UserMinus,
  UserX,
} from "lucide-react";

import type { OrganizationDetailViewModel } from "@/features/organizations/model/organizations.types";

import { ResourcePageShell } from "@/components/resource-page-shell";
import { adminResources } from "@/features/_plugin-resources/admin-resources";
import { canPromoteMemberToAdmin } from "@/features/organizations/model/organizations.permissions";
import { timeAgo } from "@/lib/format";
import { Link } from "@/i18n/navigation";

import { EditOrganizationDrawer } from "./edit-organization-drawer";

const organizationsResource = adminResources.find((r) => r.id === "organizations")!;

/**
 * Presentational organization detail. Receives a fully-resolved view model from
 * the detail controller and renders workspace metadata and member management UI.
 */
export function OrganizationDetailContent(vm: OrganizationDetailViewModel) {
  const {
    backHref,
    isError,
    onRetry,
    org,
    members,
    membersError,
    onRetryMembers,
    actorUserId,
    canRename,
    canDelete,
    canLeave,
    isLastOwner,
    canManageMember,
    canDemoteAdminToMember,
    canPromoteAdminToOwner,
    canDemoteOwnerToAdmin,
    editDialog,
    deleteConfirm,
    leaveConfirm,
    memberActions,
  } = vm;

  if (isError) {
    return (
      <ResourcePageShell resource={organizationsResource} description="Organization detail">
        <ErrorState
          variant="inline"
          className="m-4"
          title="Could not load organization."
          action={{ label: "Retry", onClick: onRetry }}
        />
      </ResourcePageShell>
    );
  }

  if (!org) {
    return (
      <ResourcePageShell resource={organizationsResource} description="Organization not found">
        <Empty
          title="Organization not found"
          description="The requested organization does not exist or has been deleted."
        />
      </ResourcePageShell>
    );
  }

  return (
    <>
      <EditOrganizationDrawer
        open={editDialog.open}
        onClose={editDialog.onClose}
        currentName={editDialog.currentName}
        onSubmit={editDialog.onSave}
        isSubmitting={editDialog.isSaving}
      />

      <ConfirmDialog
        open={deleteConfirm.open}
        title="Delete Organization"
        message={
          <>
            Are you sure you want to delete <span className="font-semibold">{org.name}</span>? This
            action will soft-delete the workspace and disable access for all members.
          </>
        }
        confirmLabel={deleteConfirm.isPending ? "Deleting…" : "Delete organization"}
        destructive
        loading={deleteConfirm.isPending}
        onCancel={deleteConfirm.onCancel}
        onConfirm={deleteConfirm.onConfirm}
      />

      <ConfirmDialog
        open={leaveConfirm.open}
        title="Leave Organization"
        message={
          isLastOwner ? (
            <p className="text-destructive font-medium">
              You are the last owner of this organization. You must promote another member to Owner
              or delete the organization instead.
            </p>
          ) : (
            <>Are you sure you want to leave {org.name}? You will lose access to its resources.</>
          )
        }
        confirmLabel={leaveConfirm.isPending ? "Leaving…" : "Leave organization"}
        destructive={!isLastOwner}
        loading={leaveConfirm.isPending}
        onCancel={leaveConfirm.onCancel}
        onConfirm={isLastOwner ? leaveConfirm.onCancel : leaveConfirm.onConfirm}
      />

      <ResourcePageShell
        resource={organizationsResource}
        title={org.name}
        description={`Manage ${org.name} workspace details and team members directory.`}
        actions={
          <div className="flex items-center gap-2">
            <Link href={backHref}>
              <Button variant="outline" size="sm">
                <ChevronLeft className="size-4" />
                Back
              </Button>
            </Link>
            <Show when={canRename}>
              <Button variant="outline" size="sm" onClick={editDialog.onOpen}>
                <Settings className="size-4" />
                Rename
              </Button>
            </Show>
            <Show when={canLeave}>
              <Button
                variant="outline"
                size="sm"
                className="text-destructive hover:bg-destructive/5"
                onClick={leaveConfirm.onOpen}
              >
                <LogOut className="size-4" />
                Leave
              </Button>
            </Show>
            <Show when={canDelete}>
              <Button variant="destructive" size="sm" onClick={deleteConfirm.onOpen}>
                <Trash2 className="size-4" />
                Delete
              </Button>
            </Show>
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-1 h-fit">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Building className="size-4 text-muted-foreground" />
                Workspace Information
              </CardTitle>
              <CardDescription>Tenant identity and metadata properties.</CardDescription>
            </CardHeader>
            <CardContent>
              <ResourcePropertyGrid
                columns={1}
                density="default"
                properties={[
                  {
                    key: "name",
                    label: "Organization name",
                    value: org.name,
                  },
                  {
                    key: "slug",
                    label: "Slug identifier",
                    value: org.slug,
                    type: "code",
                    copyable: true,
                  },
                  {
                    key: "orgId",
                    label: "Organization ID",
                    value: org.id,
                    type: "id",
                    copyable: true,
                  },
                  {
                    key: "membersCount",
                    label: "Team size",
                    value: `${members.length} member${members.length === 1 ? "" : "s"}`,
                    type: "badge",
                    badgeVariant: "secondary",
                  },
                  {
                    key: "createdAt",
                    label: "Created",
                    value: org.createdAt,
                    type: "timestamp",
                  },
                  {
                    key: "updatedAt",
                    label: "Last updated",
                    value: org.updatedAt,
                    type: "timestamp",
                  },
                ]}
              />
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <UserCheck className="size-4 text-muted-foreground" />
                Members Directory
              </CardTitle>
              <CardDescription>
                Manage team memberships, role hierarchy, and access privileges.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Show when={membersError}>
                <div className="p-4">
                  <ErrorState
                    variant="inline"
                    title="Failed to load members"
                    action={{ label: "Retry", onClick: onRetryMembers }}
                  />
                </div>
              </Show>

              {!membersError && members.length === 0 ? (
                <Empty className="py-8">
                  <EmptyContent>
                    <EmptyHeader>
                      <EmptyTitle>No members yet</EmptyTitle>
                    </EmptyHeader>
                  </EmptyContent>
                </Empty>
              ) : null}

              {!membersError && members.length > 0 ? (
                <div className="divide-y divide-border">
                  {members.map((member) => {
                    const isSelf = member.userId === actorUserId;
                    const showManage = canManageMember(member);

                    return (
                      <div
                        key={member.userId}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-muted/10"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <Avatar
                            name={member.displayName || member.email || "User"}
                            className="size-9 border border-border"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium text-sm text-foreground">
                                {member.displayName || "Unknown User"}
                              </span>
                              {isSelf ? (
                                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                  You
                                </Badge>
                              ) : null}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span className="truncate">{member.email}</span>
                              <span>·</span>
                              <span>Joined {timeAgo(member.createdAt)}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
                          <Badge
                            variant={
                              member.role === "OWNER"
                                ? "default"
                                : member.role === "ADMIN"
                                  ? "secondary"
                                  : "outline"
                            }
                            className="capitalize text-xs font-semibold gap-1"
                          >
                            {member.role === "OWNER" ? (
                              <Crown className="size-3 text-yellow-500 fill-yellow-500/20" />
                            ) : member.role === "ADMIN" ? (
                              <Shield className="size-3 text-blue-500 fill-blue-500/10" />
                            ) : (
                              <User className="size-3 text-muted-foreground" />
                            )}
                            {member.role.toLowerCase()}
                          </Badge>

                          <Show when={showManage}>
                            <div className="flex items-center gap-1.5">
                              {canPromoteMemberToAdmin(member) ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={memberActions.isUpdatingRole}
                                  onClick={() => memberActions.onUpdateRole(member.userId, "ADMIN")}
                                >
                                  {memberActions.isUpdatingRole ? (
                                    <Spinner className="size-3 mr-1" />
                                  ) : (
                                    <UserCog className="size-3 mr-1" />
                                  )}
                                  Make Admin
                                </Button>
                              ) : null}

                              {canDemoteAdminToMember(member) ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={memberActions.isUpdatingRole}
                                  onClick={() =>
                                    memberActions.onUpdateRole(member.userId, "MEMBER")
                                  }
                                >
                                  {memberActions.isUpdatingRole ? (
                                    <Spinner className="size-3 mr-1" />
                                  ) : (
                                    <UserMinus className="size-3 mr-1" />
                                  )}
                                  Demote to Member
                                </Button>
                              ) : null}

                              {canPromoteAdminToOwner(member) ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={memberActions.isUpdatingRole}
                                  onClick={() => memberActions.onUpdateRole(member.userId, "OWNER")}
                                >
                                  {memberActions.isUpdatingRole ? (
                                    <Spinner className="size-3 mr-1" />
                                  ) : (
                                    <Crown className="size-3 mr-1" />
                                  )}
                                  Make Owner
                                </Button>
                              ) : null}

                              {canDemoteOwnerToAdmin(member) ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={memberActions.isUpdatingRole}
                                  onClick={() => memberActions.onUpdateRole(member.userId, "ADMIN")}
                                >
                                  {memberActions.isUpdatingRole ? (
                                    <Spinner className="size-3 mr-1" />
                                  ) : (
                                    <UserMinus className="size-3 mr-1" />
                                  )}
                                  Demote to Admin
                                </Button>
                              ) : null}

                              <Button
                                variant="outline"
                                size="sm"
                                className="text-destructive hover:bg-destructive/5 hover:text-destructive hover:border-destructive/30"
                                disabled={memberActions.isRemoving}
                                onClick={() => memberActions.onRemove(member.userId)}
                              >
                                {memberActions.isRemoving ? (
                                  <Spinner className="size-3" />
                                ) : (
                                  <UserX className="size-3" />
                                )}
                              </Button>
                            </div>
                          </Show>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </ResourcePageShell>
    </>
  );
}
