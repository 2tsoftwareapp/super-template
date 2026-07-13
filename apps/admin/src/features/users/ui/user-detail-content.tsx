"use client";

import { Alert } from "@repo/web-core/components/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/web-core/components/card";
import { Separator } from "@repo/web-core/components/separator";
import { ShieldAlert } from "lucide-react";

import type { UserDetailViewModel } from "@/features/users/controllers/use-user-detail-controller";
import type { AdminUserDto } from "@/lib/api-types";

import { ResourcePageShell } from "@/components/resource-page-shell";
import { adminResources } from "@/lib/admin-resources";
import { timeAgo, truncateId } from "@/lib/format";

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
      {flags.isSelf && (
        <Alert variant="info">
          <div className="flex items-center gap-2">
            <ShieldAlert className="size-4 shrink-0" />
            <span>
              This is your own account. Status changes and deletion are disabled.
            </span>
          </div>
        </Alert>
      )}
      {!flags.isSelf && flags.isTargetPrivileged && !flags.isActorSuperAdmin && (
        <Alert variant="warning">
          <div className="flex items-center gap-2">
            <ShieldAlert className="size-4 shrink-0" />
            <span>
              This is a privileged account. Only a SUPER_ADMIN can edit or delete
              it.
            </span>
          </div>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Edit user</CardTitle>
          <CardDescription>
            Manage profile details, access level, and account status.
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
    </ResourcePageShell>
  );
}
