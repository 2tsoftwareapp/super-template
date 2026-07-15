"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Badge } from "@repo/web-ui/badge";
import { Button } from "@repo/web-ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@repo/web-ui/card";
import { ConfirmDialog } from "@repo/web-ui/confirm-dialog";
import { ErrorState } from "@repo/web-ui/error-state";
import { SectionLoading } from "@repo/web-ui/loading";
import { Show } from "@repo/web-ui/show";
import { Spinner } from "@repo/web-ui/spinner";
import {
  Building,
  Calendar,
  ChevronLeft,
  Crown,
  Key,
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

import { ResourcePageShell } from "@/components/resource-page-shell";
import { Link, useRouter } from "@/i18n/navigation";
import { adminResources } from "@/lib/admin-resources";
import { useSession } from "@/hooks/use-session";
import {
  useOrganizationDetailQuery,
  useOrganizationMembersQuery,
} from "../api/organizations.queries";
import {
  useDeleteOrganizationMutation,
  useLeaveOrganizationMutation,
  useRemoveMemberMutation,
  useUpdateMemberRoleMutation,
} from "../api/organizations.mutations";
import { EditOrganizationDialog } from "../ui/edit-organization-dialog";

const organizationsResource = adminResources.find((r) => r.id === "organizations")!;

export function OrganizationDetailView() {
  const params = useParams<{ id: string }>();
  const orgId = params.id;
  const router = useRouter();
  const session = useSession();

  const searchParams = useSearchParams();
  const backHref = searchParams.get("returnTo") ?? "/organizations";

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);

  const detailQuery = useOrganizationDetailQuery(orgId);
  const membersQuery = useOrganizationMembersQuery(orgId);

  const deleteOrg = useDeleteOrganizationMutation(orgId);
  const leaveOrg = useLeaveOrganizationMutation(orgId);
  const updateMemberRole = useUpdateMemberRoleMutation(orgId);
  const removeMember = useRemoveMemberMutation(orgId);

  const org = detailQuery.data?.data;
  const members = membersQuery.data?.data ?? [];

  const actorUserId = session.data?.data.user.id;
  const actorRoles = session.data?.data.user.roles ?? [];
  const isActorSuperAdmin = actorRoles.includes("SUPER_ADMIN");

  const actorMember = members.find((m) => m.userId === actorUserId);
  const actorOrgRole = actorMember?.role; // 'OWNER' | 'ADMIN' | 'MEMBER'

  const isOwner = actorOrgRole === "OWNER";
  const isAdmin = actorOrgRole === "ADMIN";

  const isLoading = detailQuery.isLoading || membersQuery.isLoading;

  const handleDelete = async () => {
    try {
      await deleteOrg.mutateAsync();
      setDeleteOpen(false);
      router.push("/organizations");
    } catch {
      // error handled in mutation
    }
  };

  const handleLeave = async () => {
    try {
      await leaveOrg.mutateAsync();
      setLeaveOpen(false);
      router.push("/organizations");
    } catch {
      // error handled in mutation
    }
  };

  if (isLoading) {
    return (
      <ResourcePageShell resource={organizationsResource} description="Loading organization details...">
        <SectionLoading />
      </ResourcePageShell>
    );
  }

  if (!org) {
    return (
      <ResourcePageShell resource={organizationsResource} description="Organization not found">
        <div className="flex flex-col items-center gap-3 py-16">
          <Building className="size-12 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">Organization not found or has been deleted.</p>
          <Link href="/organizations" className="text-sm underline text-primary">
            Back to organizations
          </Link>
        </div>
      </ResourcePageShell>
    );
  }

  const owners = members.filter((m) => m.role === "OWNER");
  const isLastOwner = actorOrgRole === "OWNER" && owners.length === 1;

  return (
    <>
      <EditOrganizationDialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        organizationId={orgId}
        currentName={org.name}
      />

      <ConfirmDialog
        open={deleteOpen}
        title="Delete Organization"
        message={
          <>
            Are you sure you want to delete <span className="font-semibold">{org.name}</span>? This action is a soft-delete but will disable access for all members.
          </>
        }
        confirmLabel={deleteOrg.isPending ? "Deleting…" : "Delete"}
        destructive
        loading={deleteOrg.isPending}
        onCancel={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
      />

      <ConfirmDialog
        open={leaveOpen}
        title="Leave Organization"
        message={
          isLastOwner ? (
            <p className="text-destructive font-medium">
              You are the last owner of this organization. You must promote another member to Owner or delete the organization instead.
            </p>
          ) : (
            <>Are you sure you want to leave {org.name}?</>
          )
        }
        confirmLabel={leaveOrg.isPending ? "Leaving…" : "Leave"}
        destructive={!isLastOwner}
        loading={leaveOrg.isPending}
        onCancel={() => setLeaveOpen(false)}
        onConfirm={isLastOwner ? () => setLeaveOpen(false) : handleLeave}
      />

      <ResourcePageShell
        resource={organizationsResource}
        description={`Manage ${org.name} workspace details and team members.`}
        actions={
          <div className="flex items-center gap-2">
            <Link href={backHref}>
              <Button variant="outline" size="sm">
                <ChevronLeft className="size-4" />
                Back
              </Button>
            </Link>
            <Show when={isActorSuperAdmin || isOwner || isAdmin}>
              <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
                <Settings className="size-4" />
                Rename
              </Button>
            </Show>
            <Show when={!!actorMember}>
              <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive/5" onClick={() => setLeaveOpen(true)}>
                <LogOut className="size-4" />
                Leave
              </Button>
            </Show>
            <Show when={isActorSuperAdmin || isOwner}>
              <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}>
                <Trash2 className="size-4" />
                Delete
              </Button>
            </Show>
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Metadata Sidebar Card */}
          <Card className="lg:col-span-1 h-fit">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Building className="size-4 text-muted-foreground" />
                Workspace Information
              </CardTitle>
              <CardDescription>System properties for this tenant.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 text-sm">
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Name</span>
                <span className="font-semibold text-foreground">{org.name}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Slug</span>
                <span className="font-mono bg-muted/70 px-2 py-0.5 rounded border border-border/80 w-fit text-xs">
                  {org.slug}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Organization ID</span>
                <span className="font-mono text-xs select-all text-muted-foreground break-all">{org.id}</span>
              </div>
              <div className="flex flex-col gap-1 border-t border-border pt-3">
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="size-3.5" /> Created At
                </span>
                <span className="text-muted-foreground text-xs">
                  {new Date(org.createdAt).toLocaleString()}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="size-3.5" /> Updated At
                </span>
                <span className="text-muted-foreground text-xs">
                  {new Date(org.updatedAt).toLocaleString()}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Members List Card */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <UserCheck className="size-4 text-muted-foreground" />
                Members Directory
              </CardTitle>
              <CardDescription>Manage user roles and memberships.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Show when={membersQuery.isError}>
                <ErrorState
                  variant="inline"
                  title="Failed to load members"
                  action={{ label: "Retry", onClick: () => void membersQuery.refetch() }}
                />
              </Show>

              {!membersQuery.isError && members.length === 0 ? (
                <div className="p-6 text-center text-sm text-muted-foreground">
                  No members found in this organization.
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {members.map((member) => {
                    const isSelf = member.userId === actorUserId;
                    const canManage =
                      !isSelf &&
                      (isActorSuperAdmin ||
                        isOwner ||
                        (isAdmin && member.role === "MEMBER"));

                    const targetIsOwner = member.role === "OWNER";
                    const targetIsAdmin = member.role === "ADMIN";

                    return (
                      <div
                        key={member.userId}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-muted/10"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border bg-muted/40">
                            {member.role === "OWNER" ? (
                              <Crown className="size-4 text-yellow-500 fill-yellow-500/20" />
                            ) : member.role === "ADMIN" ? (
                              <Shield className="size-4 text-blue-500 fill-blue-500/10" />
                            ) : (
                              <User className="size-4 text-muted-foreground" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium text-sm text-foreground">
                                {member.displayName || "Unknown User"}
                              </span>
                              {isSelf && (
                                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                  You
                                </Badge>
                              )}
                            </div>
                            <span className="block text-xs text-muted-foreground truncate">
                              {member.email}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                          {/* Role Badge */}
                          <Badge
                            variant={
                              member.role === "OWNER"
                                ? "default"
                                : member.role === "ADMIN"
                                  ? "secondary"
                                  : "outline"
                            }
                            className="capitalize text-xs font-semibold"
                          >
                            {member.role.toLowerCase()}
                          </Badge>

                          {/* Member Role promotions/demotions and removal */}
                          <Show when={canManage}>
                            <div className="flex items-center gap-1.5">
                              {/* Promotion / Demotion Actions */}
                              {member.role === "MEMBER" && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={updateMemberRole.isPending}
                                  onClick={() =>
                                    updateMemberRole.mutateAsync({
                                      userId: member.userId,
                                      role: "ADMIN",
                                    })
                                  }
                                >
                                  {updateMemberRole.isPending ? (
                                    <Spinner className="size-3 mr-1" />
                                  ) : (
                                    <UserCog className="size-3 mr-1" />
                                  )}
                                  Make Admin
                                </Button>
                              )}

                              {member.role === "ADMIN" && (isActorSuperAdmin || isOwner) && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={updateMemberRole.isPending}
                                  onClick={() =>
                                    updateMemberRole.mutateAsync({
                                      userId: member.userId,
                                      role: "MEMBER",
                                    })
                                  }
                                >
                                  {updateMemberRole.isPending ? (
                                    <Spinner className="size-3 mr-1" />
                                  ) : (
                                    <UserMinus className="size-3 mr-1" />
                                  )}
                                  Demote to Member
                                </Button>
                              )}

                              {member.role === "ADMIN" && (isActorSuperAdmin || isOwner) && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={updateMemberRole.isPending}
                                  onClick={() =>
                                    updateMemberRole.mutateAsync({
                                      userId: member.userId,
                                      role: "OWNER",
                                    })
                                  }
                                >
                                  {updateMemberRole.isPending ? (
                                    <Spinner className="size-3 mr-1" />
                                  ) : (
                                    <Crown className="size-3 mr-1" />
                                  )}
                                  Make Owner
                                </Button>
                              )}

                              {member.role === "OWNER" && isActorSuperAdmin && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={updateMemberRole.isPending}
                                  onClick={() =>
                                    updateMemberRole.mutateAsync({
                                      userId: member.userId,
                                      role: "ADMIN",
                                    })
                                  }
                                >
                                  {updateMemberRole.isPending ? (
                                    <Spinner className="size-3 mr-1" />
                                  ) : (
                                    <UserMinus className="size-3 mr-1" />
                                  )}
                                  Demote to Admin
                                </Button>
                              )}

                              {/* Remove Member Action */}
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-destructive hover:bg-destructive/5 hover:text-destructive hover:border-destructive/30"
                                disabled={removeMember.isPending}
                                onClick={() => removeMember.mutateAsync(member.userId)}
                              >
                                {removeMember.isPending ? (
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
              )}
            </CardContent>
          </Card>
        </div>
      </ResourcePageShell>
    </>
  );
}
