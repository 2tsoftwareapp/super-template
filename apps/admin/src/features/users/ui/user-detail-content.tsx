"use client";

import { Alert } from "@repo/web-ui/alert";
import { Badge } from "@repo/web-ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/web-ui/card";
import { ResourcePropertyGrid } from "@repo/web-ui/resource-property-grid";
import { Separator } from "@repo/web-ui/separator";
import { ShieldAlert, User as UserIcon } from "lucide-react";

import type { UserDetailViewModel } from "@/features/users/model/users.types";
import type { AdminUserDto } from "@/lib/api-types";

import { ResourcePageShell } from "@/components/resource-page-shell";
import { adminResources } from "@/features/_plugin-resources/admin-resources";
import { formatRoleName } from "@/lib/roles";
import { timeAgo, truncateId } from "@/lib/format";

import { UserDetailAuditTimeline } from "./user-detail-audit-timeline";
import { UserDetailDangerZone } from "./user-detail-danger-zone";
import { UserDetailMeta } from "./user-detail-meta";
import { UserDetailProfile } from "./user-detail-profile";
import { UserDetailRoles } from "./user-detail-roles";
import { UserDetailStatus } from "./user-detail-status";

const usersResource = adminResources.find((r) => r.id === "users")!;

interface UserDetailContentProps {
  vm: UserDetailViewModel;
  user: AdminUserDto;
}

/**
 * Presentational user detail view. Receives a fully-resolved view model (and the
 * loaded user) from the user detail controller and renders it; it owns no server
 * state, session, route params, or workflow orchestration.
 */
export function UserDetailContent({ vm, user }: UserDetailContentProps) {
  const { flags, profile, status, roles, danger } = vm;
  const isVerified = Boolean((user as Record<string, unknown>).emailVerifiedAt);

  return (
    <ResourcePageShell
      resource={usersResource}
      title={user.displayName}
      description={`${user.email} · Joined ${timeAgo(user.createdAt)} · ID: ${truncateId(user.id)}`}
      meta={<UserDetailMeta user={user} flags={flags} />}
      backHref={vm.backHref}
      onRefresh={vm.onRefresh}
      isRefreshing={vm.isRefreshing}
    >
      <div className="space-y-6">
        {flags.isSelf && (
          <Alert variant="info">
            <div className="flex items-center gap-2">
              <ShieldAlert className="size-4 shrink-0" />
              <span>This is your own account. Status changes and deletion are disabled.</span>
            </div>
          </Alert>
        )}
        {!flags.isSelf && flags.isTargetPrivileged && !flags.isActorSuperAdmin && (
          <Alert variant="warning">
            <div className="flex items-center gap-2">
              <ShieldAlert className="size-4 shrink-0" />
              <span>This is a privileged account. Only a SUPER_ADMIN can edit or delete it.</span>
            </div>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <UserIcon className="size-4 text-muted-foreground" />
              User Overview
            </CardTitle>
            <CardDescription>
              Account identity, status, and system metadata properties.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResourcePropertyGrid
              columns={2}
              density="default"
              properties={[
                {
                  key: "userId",
                  label: "User ID",
                  value: user.id,
                  type: "id",
                  copyable: true,
                },
                {
                  key: "email",
                  label: "Email address",
                  value: user.email,
                  copyable: true,
                },
                {
                  key: "displayName",
                  label: "Display name",
                  value: user.displayName || "—",
                },
                {
                  key: "status",
                  label: "Account status",
                  value: user.status,
                  type: "status",
                  statusVariant:
                    user.status === "ACTIVE"
                      ? "success"
                      : user.status === "BLOCKED"
                        ? "destructive"
                        : "warning",
                },
                {
                  key: "emailVerified",
                  label: "Email verification",
                  value: isVerified ? "Verified" : "Unverified",
                  type: "badge",
                  badgeVariant: isVerified ? "default" : "outline",
                },
                {
                  key: "assignedRoles",
                  label: "Assigned roles",
                  value: (
                    <div className="flex flex-wrap gap-1">
                      {user.roles && user.roles.length > 0 ? (
                        user.roles.map((r) => (
                          <Badge
                            key={r}
                            variant={r === "SUPER_ADMIN" || r === "ADMIN" ? "default" : "secondary"}
                            className="text-[11px] px-1.5 py-0"
                          >
                            {formatRoleName(r)}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-xs text-muted-foreground">No roles assigned</span>
                      )}
                    </div>
                  ),
                  type: "custom",
                },
                {
                  key: "createdAt",
                  label: "Registered on",
                  value: user.createdAt,
                  type: "timestamp",
                },
                {
                  key: "updatedAt",
                  label: "Last updated",
                  value: user.updatedAt,
                  type: "timestamp",
                },
              ]}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Edit User &amp; Access</CardTitle>
            <CardDescription>
              Manage profile details, account status, and role access level.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <UserDetailProfile profile={profile} canEdit={flags.canEdit} />

            <Separator />

            <UserDetailStatus status={status} />

            <Separator />

            <UserDetailRoles roles={roles} />

            {!flags.isSelf && (
              <>
                <Separator />
                <UserDetailDangerZone
                  danger={danger}
                  displayName={user.displayName}
                  canEdit={flags.canEdit}
                />
              </>
            )}
          </CardContent>
        </Card>

        <UserDetailAuditTimeline userId={user.id} />
      </div>
    </ResourcePageShell>
  );
}
