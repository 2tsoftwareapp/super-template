"use client";

import { standardSchemaResolver as zodResolver } from "@hookform/resolvers/standard-schema";
import { Alert } from "@repo/web-core/components/alert";
import { Badge } from "@repo/web-core/components/badge";
import { Button } from "@repo/web-core/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/web-core/components/card";
import { ConfirmDialog } from "@repo/web-core/components/confirm-dialog";
import { Input } from "@repo/web-core/components/input";
import { Label } from "@repo/web-core/components/label";
import { Separator } from "@repo/web-core/components/separator";
import { Skeleton } from "@repo/web-core/components/skeleton";
import { Spinner } from "@repo/web-core/components/spinner";
import { BadgeCheck, CheckCircle2, ShieldAlert, Trash2, XCircle } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import { ResourcePageShell } from "@/components/resource-page-shell";
import {
  useDeleteUserMutation,
  useReplaceRolesMutation,
  useUpdateProfileMutation,
  useUpdateStatusMutation,
} from "@/features/users/use-user-detail-mutations";
import {
  useAdminRolesQuery,
  useAdminUserQuery,
} from "@/features/users/use-user-detail-queries";
import {
  type ProfileForm,
  profileSchema,
} from "@/features/users/users-schemas";
import { useSession } from "@/hooks/use-session";
import { adminResources } from "@/lib/admin-resources";
import { statusProps, timeAgo, truncateId } from "@/lib/format";
import { cn } from "@/lib/utils";

const usersResource = adminResources.find((r) => r.id === "users")!;
const STATUS_OPTIONS = ["PENDING", "ACTIVE", "BLOCKED"] as const;
type UserStatus = (typeof STATUS_OPTIONS)[number];
const EMPTY_ROLES: string[] = [];

export function UserDetailView() {
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

  const currentUser = user.data?.data;

  // ── Derived ────────────────────────────────────────────────────────────────
  const actorId = session.data?.data.user.id;
  const actorRoles = session.data?.data.user.roles ?? EMPTY_ROLES;
  const isActorSuperAdmin = actorRoles.includes("SUPER_ADMIN");
  const isSelf = actorId === currentUser?.id;
  const canEdit = isActorSuperAdmin || !currentUser?.roles?.some(
    (r) => r === "SUPER_ADMIN" || r === "ADMIN",
  ) || isActorSuperAdmin;

  useEffect(() => {
    if (currentUser) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sync editable fields when user loads
      setSelectedStatus(currentUser.status);
      setSelectedRole(currentUser.roles.includes("ADMIN") ? "ADMIN" : "USER");
    }
  }, [currentUser]);

  // ── Mutations ──────────────────────────────────────────────────────────────
  const updateProfile = useUpdateProfileMutation(userId);
  const updateStatus = useUpdateStatusMutation(userId);
  const replaceRoles = useReplaceRolesMutation(userId);
  const deleteUser = useDeleteUserMutation(userId, {
    onSuccess: () => {
      router.replace("/users");
    },
  });

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    values: {
      email: currentUser?.email ?? "",
      displayName: currentUser?.displayName ?? "",
    },
  });

  // ── Guards ─────────────────────────────────────────────────────────────────
  if (!userId) return null;

  if (user.isLoading) {
    return (
      <ResourcePageShell resource={usersResource} description="Manage user profile.">
        <Skeleton className="h-72 rounded-xl" />
      </ResourcePageShell>
    );
  }

  if (!currentUser) {
    return (
      <ResourcePageShell resource={usersResource} description="User not found.">
        <div className="flex flex-col items-center gap-3 py-16">
          <p className="text-sm text-muted-foreground">User not found.</p>
          <Link href="/users" className="text-sm underline">Back to users</Link>
        </div>
      </ResourcePageShell>
    );
  }

  const { variant: sv, className: sc } = statusProps(currentUser.status);
  const primaryRole = currentUser.roles.includes("ADMIN") ? "ADMIN" : "USER";
  const statusDisabled = isSelf || !canEdit || updateStatus.isPending;
  const roleDisabled = isSelf || !canEdit || replaceRoles.isPending;
  const isTargetPrivileged = currentUser.roles?.some(
    (r) => r === "SUPER_ADMIN" || r === "ADMIN",
  );

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
          <Badge
            variant="outline"
            className={cn(
              "gap-1 text-[11px] px-1.5 py-0",
              (currentUser as Record<string, unknown>).emailVerifiedAt
                ? "text-primary border-primary/30"
                : "text-muted-foreground",
            )}
          >
            {(currentUser as Record<string, unknown>).emailVerifiedAt
              ? <><BadgeCheck className="size-3" /> Verified</>
              : <><XCircle className="size-3" /> Unverified</>}
          </Badge>
          {currentUser.roles.map((r) => (
            <Badge key={r} variant={r === "SUPER_ADMIN" || r === "ADMIN" ? "default" : "secondary"}>
              {r.toLowerCase().replace(/_/g, " ")}
            </Badge>
          ))}
          {isSelf && <Badge variant="secondary">You</Badge>}
        </>
      }
      backHref={backHref}
      onRefresh={() => void user.refetch()}
      isRefreshing={user.isFetching}
    >
      {isSelf && (
        <Alert variant="info">
          <div className="flex items-center gap-2">
            <ShieldAlert className="size-4 shrink-0" />
            <span>This is your own account. Status changes and deletion are disabled.</span>
          </div>
        </Alert>
      )}
      {!isSelf && isTargetPrivileged && !isActorSuperAdmin && (
        <Alert variant="warning">
          <div className="flex items-center gap-2">
            <ShieldAlert className="size-4 shrink-0" />
            <span>This is a privileged account. Only a SUPER_ADMIN can edit or delete it.</span>
          </div>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Edit user</CardTitle>
          <CardDescription>Manage profile details, access level, and account status.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* ── Profile ── */}
          <div>
            <h4 className="mb-3 text-sm font-medium">Profile</h4>
            <form
              className="grid gap-4 sm:grid-cols-2"
              onSubmit={profileForm.handleSubmit((values) => {
                void updateProfile.mutateAsync(values);
              })}
            >
              <div className="space-y-1.5">
                <Label htmlFor="p-name">Display name</Label>
                <Input id="p-name" {...profileForm.register("displayName")} disabled={!canEdit} />
                {profileForm.formState.errors.displayName && (
                  <p className="text-xs text-destructive">{profileForm.formState.errors.displayName.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="p-email">Email</Label>
                <Input id="p-email" type="email" {...profileForm.register("email")} disabled={!canEdit} />
                {profileForm.formState.errors.email && (
                  <p className="text-xs text-destructive">{profileForm.formState.errors.email.message}</p>
                )}
              </div>
              <div className="flex items-center gap-3 sm:col-span-2">
                <Button type="submit" disabled={updateProfile.isPending || !canEdit || (!profileForm.formState.isDirty && !updateProfile.isError)}>
                  {updateProfile.isPending ? <><Spinner className="size-4" /> Saving…</> : "Save profile"}
                </Button>
                {updateProfile.isSuccess && (
                  <span className="flex items-center gap-1 text-xs text-primary"><CheckCircle2 className="size-3" /> Saved</span>
                )}
                {updateProfile.isError && (
                  <span className="text-xs text-destructive">Save failed.</span>
                )}
              </div>
            </form>
          </div>

          <Separator />

          {/* ── Status ── */}
          <div>
            <h4 className="mb-3 text-sm font-medium">Status</h4>
            <div className="flex flex-wrap items-center gap-1 rounded-lg border border-border p-1">
              {STATUS_OPTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  disabled={statusDisabled}
                  onClick={() => setSelectedStatus(s)}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors",
                    "disabled:cursor-not-allowed disabled:opacity-40",
                    selectedStatus === s
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {s.toLowerCase()}
                </button>
              ))}
            </div>
            <div className="mt-3 flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                disabled={statusDisabled || selectedStatus === currentUser.status}
                onClick={() => void updateStatus.mutateAsync(selectedStatus)}
              >
                {updateStatus.isPending ? <><Spinner className="size-3.5" /> Updating…</> : "Apply status"}
              </Button>
              {updateStatus.isSuccess && (
                <span className="flex items-center gap-1 text-xs text-primary"><CheckCircle2 className="size-3" /> Updated</span>
              )}
              {updateStatus.isError && (
                <span className="text-xs text-destructive">
                  Failed. <button type="button" className="underline" onClick={() => void updateStatus.mutateAsync(selectedStatus)}>Retry</button>
                </span>
              )}
            </div>
          </div>

          <Separator />

          {/* ── Roles ── */}
          <div>
            <h4 className="mb-3 text-sm font-medium">Roles</h4>
            {roles.isLoading ? (
              <Spinner className="size-4" />
            ) : (
              <div className="space-y-1.5">
                {(["ADMIN", "USER"] as const).map((roleName) => {
                  const checked = selectedRole === roleName;
                  return (
                    <button
                      key={roleName}
                      type="button"
                      disabled={roleDisabled}
                      onClick={() => setSelectedRole(roleName)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors",
                        "disabled:cursor-not-allowed disabled:opacity-40",
                        checked ? "border-foreground bg-foreground/5" : "border-border hover:border-foreground/30",
                      )}
                    >
                      <span className={cn(
                        "flex size-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                        checked ? "border-foreground bg-foreground" : "border-muted-foreground",
                      )}>
                        {checked && <span className="size-1.5 rounded-full bg-background" />}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{roleName.toLowerCase()}</p>
                        <p className="text-xs text-muted-foreground">
                          {roleName === "ADMIN" ? "Full access to all admin features." : "Limited access based on assigned permissions."}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
            <div className="mt-3 flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                disabled={roleDisabled || selectedRole === primaryRole}
                onClick={() => void replaceRoles.mutateAsync(selectedRole)}
              >
                {replaceRoles.isPending ? <><Spinner className="size-3.5" /> Saving…</> : "Save roles"}
              </Button>
              {replaceRoles.isSuccess && (
                <span className="flex items-center gap-1 text-xs text-primary"><CheckCircle2 className="size-3" /> Saved</span>
              )}
              {replaceRoles.isError && (
                <span className="text-xs text-destructive">
                  Failed. <button type="button" className="underline" onClick={() => void replaceRoles.mutateAsync(selectedRole)}>Retry</button>
                </span>
              )}
            </div>
          </div>

          {/* ── Danger zone ── */}
          {!isSelf && (
            <>
              <Separator />
              <div>
                <h4 className="mb-3 text-sm font-medium text-destructive flex items-center gap-2">
                  <Trash2 className="size-4" /> Danger zone
                </h4>
                {!canEdit ? (
                  <p className="text-xs text-muted-foreground">Only SUPER_ADMIN can delete privileged accounts.</p>
                ) : (
                  <>
                    {confirmDelete && (
                      <ConfirmDialog
                        open
                        title="Delete user"
                        message={
                          <>
                            Permanently delete <span className="font-medium text-foreground">{currentUser.displayName}</span>? This cannot be undone.
                          </>
                        }
                        confirmLabel={deleteUser.isPending ? "Deleting…" : "Confirm delete"}
                        destructive
                        loading={deleteUser.isPending}
                        onCancel={() => setConfirmDelete(false)}
                        onConfirm={async () => {
                          await deleteUser.mutateAsync();
                          setConfirmDelete(false);
                        }}
                      />
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:border-destructive/50 hover:bg-destructive/5 hover:text-destructive"
                      onClick={() => setConfirmDelete(true)}
                    >
                      <Trash2 className="size-3.5" />
                      Delete user
                    </Button>
                    {deleteUser.isError && (
                      <p className="mt-2 text-xs text-destructive">
                        Delete failed. <button type="button" className="underline" onClick={() => void deleteUser.mutateAsync()}>Retry</button>
                      </p>
                    )}
                  </>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </ResourcePageShell>
  );
}
