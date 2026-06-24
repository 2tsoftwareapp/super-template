"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ShieldAlert } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";

import type {
  AdminUserDto,
  ListResponse,
  RoleDto,
  UpdateAdminUserInput,
  UpdateUserStatusInput,
} from "@/lib/api-types";

import { ResourcePageShell } from "@/components/resource-page-shell";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useSession } from "@/hooks/use-session";
import { adminResources } from "@/lib/admin-resources";
import { statusProps, timeAgo, truncateId } from "@/lib/format";
import { webFetch } from "@/lib/http";
import { formatRoleName, getAssignableRoles, isPrivilegedRoleName } from "@/lib/roles";

import { DangerZone } from "./danger-zone";
import { ProfileSection } from "./profile-section";
import { RolesSection } from "./roles-section";
import { StatusSection } from "./status-section";

const usersResource = adminResources.find((r) => r.id === "users")!;
const EMPTY_ROLES: string[] = [];
const EMPTY_ROLE_LIST: RoleDto[] = [];

export function UserDetailView() {
  const params = useParams<{ id: string }>();
  const userId = params.id;
  const queryClient = useQueryClient();
  const router = useRouter();
  const session = useSession();
  const searchParams = useSearchParams();

  const backHref = searchParams.get("returnTo") ?? "/users";

  const user = useQuery({
    queryKey: ["admin-user", userId],
    queryFn: () =>
      webFetch<{ data: AdminUserDto }>(`/api/bff/admin/users/${userId}`),
    enabled: Boolean(userId),
  });

  const roles = useQuery({
    queryKey: ["admin-roles"],
    queryFn: () => webFetch<ListResponse<RoleDto>>("/api/bff/admin/roles"),
  });

  const currentUser = user.data?.data;
  const roleList = roles.data?.data ?? EMPTY_ROLE_LIST;
  const actorRoles = session.data?.data.user.roles ?? EMPTY_ROLES;
  const assignableRoles = useMemo(
    () => getAssignableRoles(actorRoles, roleList),
    [actorRoles, roleList],
  );
  const assignableRoleNames = useMemo(
    () =>
      Array.from(new Set(assignableRoles.map((role) => role.name))).filter(
        (name): name is "ADMIN" | "USER" =>
          name === "ADMIN" || name === "USER",
      ),
    [assignableRoles],
  );

  // ── Derived protection flags ───────────────────────────────────────────────
  const actorId = session.data?.data.user.id;
  const isActorSuperAdmin = actorRoles.includes("SUPER_ADMIN");
  const isSelf = actorId === currentUser?.id;
  const isTargetPrivileged = Boolean(
    currentUser?.roles?.some((role) => isPrivilegedRoleName(role)),
  );
  const canEdit = isActorSuperAdmin || !isTargetPrivileged;

  // ── Mutations ──────────────────────────────────────────────────────────────
  const updateProfile = useMutation({
    mutationFn: (input: UpdateAdminUserInput) =>
      webFetch<{ data: AdminUserDto }>(`/api/bff/admin/users/${userId}`, {
        method: "PATCH",
        body: JSON.stringify(input),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-user", userId] });
    },
  });

  const updateStatus = useMutation({
    mutationFn: (input: UpdateUserStatusInput) =>
      webFetch<{ data: AdminUserDto }>(
        `/api/bff/admin/users/${userId}/status`,
        { method: "PATCH", body: JSON.stringify(input) },
      ),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-user", userId] });
    },
  });

  const replaceRoles = useMutation({
    mutationFn: (role: "ADMIN" | "USER") =>
      webFetch<{ data: AdminUserDto }>(
        `/api/bff/admin/users/${userId}/roles`,
        { method: "PUT", body: JSON.stringify({ role }) },
      ),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-user", userId] });
    },
  });

  const deleteUser = useMutation({
    mutationFn: () =>
      webFetch(`/api/bff/admin/users/${userId}`, { method: "DELETE" }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      router.replace("/users");
    },
  });

  // ── Guards ─────────────────────────────────────────────────────────────────
  if (!userId) return null;

  if (user.isLoading) {
    return (
      <ResourcePageShell
        resource={usersResource}
        description="Manage profile, status, and role assignments."
      >
        <div className="space-y-4">
          <Skeleton className="h-44 rounded-xl" />
          <Skeleton className="h-44 rounded-xl" />
        </div>
      </ResourcePageShell>
    );
  }

  if (!currentUser) {
    return (
      <ResourcePageShell
        resource={usersResource}
        description="User not found."
      >
        <div className="flex flex-col items-center justify-center gap-3 py-16">
          <p className="text-sm text-muted-foreground">User not found.</p>
          <Link href="/users" className="text-sm underline">
            Back to users
          </Link>
        </div>
      </ResourcePageShell>
    );
  }

  const { variant: sv, className: sc } = statusProps(currentUser.status);
  const primaryRole = currentUser.roles.includes("ADMIN") ? "ADMIN" : "USER";

  return (
    <ResourcePageShell
      resource={usersResource}
      title={currentUser.displayName}
      description={`${currentUser.email} · Joined ${timeAgo(currentUser.createdAt)} · ID: ${truncateId(currentUser.id)}`}
      meta={
        <>
          <Badge variant={sv} className={sc}>
            {currentUser.status.toLowerCase()}
          </Badge>
          {currentUser.roles.map((r) => (
            <Badge
              key={r}
              variant={isPrivilegedRoleName(r) ? "default" : "secondary"}
            >
              {formatRoleName(r)}
            </Badge>
          ))}
          {isSelf && <Badge variant="secondary">You</Badge>}
        </>
      }
      actions={
        <Link
          href={backHref}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-3.5"><path d="M19 12H5"/><polyline points="12 19 5 12 12 5"/></svg>
          Back
        </Link>
      }
      onRefresh={() => void user.refetch()}
      isRefreshing={user.isFetching}
    >
      {/* ── Protection banners ── */}
      {isSelf && (
        <Alert variant="info">
          <div className="flex items-center gap-2">
            <ShieldAlert className="size-4 shrink-0" />
            <span>
              This is your own account. Status changes and deletion are disabled.
            </span>
          </div>
        </Alert>
      )}
      {!isSelf && isTargetPrivileged && !isActorSuperAdmin && (
        <Alert variant="warning">
          <div className="flex items-center gap-2">
            <ShieldAlert className="size-4 shrink-0" />
            <span>
              This is a privileged account. Only a SUPER_ADMIN can edit or delete it.
            </span>
          </div>
        </Alert>
      )}

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <ProfileSection
          user={currentUser}
          canEdit={canEdit}
          onSave={async (input) => { await updateProfile.mutateAsync(input); }}
          isSaving={updateProfile.isPending}
          saveError={updateProfile.isError}
          saveSuccess={updateProfile.isSuccess}
        />

        <div className="space-y-4">
          <StatusSection
            userStatus={currentUser.status}
            canEdit={canEdit}
            isSelf={isSelf}
            onApply={async (status) => {
              await updateStatus.mutateAsync({ status });
            }}
            isUpdating={updateStatus.isPending}
            updateError={updateStatus.isError}
            updateSuccess={updateStatus.isSuccess}
          />

          <RolesSection
            currentRole={primaryRole}
            canEdit={canEdit}
            isSelf={isSelf}
            assignableRoleNames={assignableRoleNames}
            rolesLoading={roles.isLoading}
            onSave={async (role) => { await replaceRoles.mutateAsync(role); }}
            isSaving={replaceRoles.isPending}
            saveError={replaceRoles.isError}
            saveSuccess={replaceRoles.isSuccess}
          />

          {!isSelf && (
            <DangerZone
              displayName={currentUser.displayName}
              canEdit={canEdit}
              onDelete={async () => { await deleteUser.mutateAsync(); }}
              isDeleting={deleteUser.isPending}
              deleteError={deleteUser.isError}
            />
          )}
        </div>
      </div>
    </ResourcePageShell>
  );
}
