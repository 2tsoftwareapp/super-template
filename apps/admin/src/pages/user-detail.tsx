import { standardSchemaResolver as zodResolver } from "@hookform/resolvers/standard-schema";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, ArrowLeft, CheckCircle2, Circle, ShieldAlert, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useParams } from "react-router-dom";
import { z } from "zod";

import type {
  AdminUserDto,
  ListResponse,
  ReplaceUserRolesInput,
  RoleDto,
  UpdateAdminUserInput,
  UpdateUserStatusInput,
} from "../lib/types";

import { Alert } from "../components/ui/alert";
import { Avatar } from "../components/ui/avatar";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Spinner } from "../components/ui/spinner";
import { statusProps, timeAgo } from "../lib/format";
import { webFetch } from "../lib/http";
import {
  buildRoleLookup,
  formatRoleName,
  getAssignableRoles,
  isPrivilegedRoleName,
} from "../lib/roles";
import { useSession } from "../lib/session";
import { cn } from "../lib/utils";

const profileSchema = z.object({
  email: z.email(),
  displayName: z.string().min(2),
});
type ProfileForm = z.infer<typeof profileSchema>;

const STATUS_OPTIONS = ["PENDING", "ACTIVE", "BLOCKED"] as const;
type UserStatus = (typeof STATUS_OPTIONS)[number];
const EMPTY_ROLES: string[] = [];
const EMPTY_ROLE_LIST: RoleDto[] = [];

export function UserDetailPage() {
  const { id: userId } = useParams();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const session = useSession();

  const [selectedStatus, setSelectedStatus] = useState<UserStatus>("PENDING");
  const [selectedRoleIds, setSelectedRoleIds] = useState<Set<string>>(new Set());
  const [confirmDelete, setConfirmDelete] = useState(false);

  const user = useQuery({
    queryKey: ["admin-user", userId],
    queryFn: () => webFetch<{ data: AdminUserDto }>(`/api/v1/admin/users/${userId}`),
    enabled: Boolean(userId),
  });

  const roles = useQuery({
    queryKey: ["admin-roles"],
    queryFn: () => webFetch<ListResponse<RoleDto>>("/api/v1/admin/roles"),
  });

  const currentUser = user.data?.data;
  const roleList = roles.data?.data ?? EMPTY_ROLE_LIST;
  const roleLookup = useMemo(() => buildRoleLookup(roleList), [roleList]);
  const actorRoles = session.data?.data.user.roles ?? EMPTY_ROLES;
  const assignableRoles = useMemo(
    () => getAssignableRoles(actorRoles, roleList),
    [actorRoles, roleList],
  );

  // ── Derived protection flags ───────────────────────────────────────────────
  const actorId = session.data?.data.user.id;
  const isActorSuperAdmin = actorRoles.includes("SUPER_ADMIN");
  const isSelf = actorId === currentUser?.id;
  const isTargetPrivileged = Boolean(
    currentUser?.roles?.some((role) => isPrivilegedRoleName(role)),
  );
  const canEdit = isActorSuperAdmin || !isTargetPrivileged;
  const canEditRoles = !isSelf && canEdit;

  useEffect(() => {
    if (!currentUser) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedStatus(currentUser.status);
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser || !roles.data) return;
    const matched = new Set(
      currentUser.roleIds?.length
        ? currentUser.roleIds.filter((roleId) => roleLookup.has(roleId))
        : roleList
            .filter((role) => currentUser.roles.includes(role.name))
            .map((role) => role.id),
    );
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedRoleIds(matched);
  }, [currentUser, roleLookup, roleList, roles.data]);

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    values: {
      email: currentUser?.email ?? "",
      displayName: currentUser?.displayName ?? "",
    },
  });

  const updateProfile = useMutation({
    mutationFn: (input: UpdateAdminUserInput) =>
      webFetch<{ data: AdminUserDto }>(`/api/v1/admin/users/${userId}`, {
        method: "PATCH",
        body: JSON.stringify(input),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-user", userId] });
    },
  });

  const updateStatus = useMutation({
    mutationFn: (input: UpdateUserStatusInput) =>
      webFetch<{ data: AdminUserDto }>(`/api/v1/admin/users/${userId}/status`, {
        method: "PATCH",
        body: JSON.stringify(input),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-user", userId] });
    },
  });

  const replaceRoles = useMutation({
    mutationFn: (input: ReplaceUserRolesInput) =>
      webFetch<{ data: AdminUserDto }>(`/api/v1/admin/users/${userId}/roles`, {
        method: "PUT",
        body: JSON.stringify(input),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-user", userId] });
    },
  });

  const deleteUser = useMutation({
    mutationFn: () => webFetch(`/api/v1/admin/users/${userId}`, { method: "DELETE" }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      void navigate("/users", { replace: true });
    },
  });

  if (!userId) return null;

  if (user.isLoading) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <Spinner className="size-5" />
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="flex min-h-64 flex-col items-center justify-center gap-3">
        <p className="text-sm text-muted-foreground">User not found.</p>
        <Link to="/users" className="text-sm underline">Back to users</Link>
      </div>
    );
  }

  const { variant: sv, className: sc } = statusProps(currentUser.status);

  const toggleRole = (id: string) =>
    setSelectedRoleIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div className="space-y-6">
      <Link
        to="/users"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" />
        All users
      </Link>

      {/* ── Protection banner ── */}
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
            <span>
              This is a privileged account. Only a SUPER_ADMIN can edit or
              delete it.
            </span>
          </div>
        </Alert>
      )}

      {/* ── User header ── */}
      <Card>
        <CardContent className="flex flex-wrap items-center gap-5 pt-5 pb-5">
          <Avatar name={currentUser.displayName} size="lg" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold">{currentUser.displayName}</h1>
              <Badge variant={sv} className={cn("capitalize", sc)}>
                {currentUser.status.toLowerCase()}
              </Badge>
              {isSelf && (
                <Badge variant="secondary" className="text-xs">You</Badge>
              )}
              {currentUser.roles.map((r) => (
                <Badge key={r} variant={isPrivilegedRoleName(r) ? "default" : "secondary"} className="text-xs">
                  {formatRoleName(r)}
                </Badge>
              ))}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{currentUser.email}</p>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span>Joined {timeAgo(currentUser.createdAt)}</span>
              {currentUser.emailVerifiedAt ? (
                <span className="flex items-center gap-1 text-emerald-600">
                  <CheckCircle2 className="size-3" /> Email verified
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <Circle className="size-3" /> Email not verified
                </span>
              )}
              <span className="font-mono opacity-40">{currentUser.id}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        {/* ── Profile form ── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Profile</CardTitle>
            <CardDescription className="text-xs">Core account details.</CardDescription>
          </CardHeader>
          <CardContent>
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
                <Button type="submit" disabled={updateProfile.isPending || !canEdit}>
                  {updateProfile.isPending ? (
                    <><Spinner className="size-4" /> Saving…</>
                  ) : "Save profile"}
                </Button>
                {updateProfile.isSuccess && (
                  <span className="flex items-center gap-1 text-xs text-emerald-600">
                    <CheckCircle2 className="size-3" /> Saved
                  </span>
                )}
                {updateProfile.isError && (
                  <span className="text-xs text-destructive">Save failed.</span>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        {/* ── Right column ── */}
        <div className="space-y-4">
          {/* Status */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(isSelf || !canEdit) && (
              <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-400">
                  <AlertTriangle className="size-3.5 shrink-0" />
                  {isSelf
                    ? "Cannot change your own status."
                    : "Requires SUPER_ADMIN to change privileged accounts."}
                </div>
              )}
              <div className="grid grid-cols-3 gap-2">
                {STATUS_OPTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    disabled={isSelf || !canEdit}
                    onClick={() => setSelectedStatus(s)}
                    className={cn(
                      "rounded-lg border py-2 text-xs font-medium capitalize transition-colors disabled:cursor-not-allowed disabled:opacity-40",
                      selectedStatus === s
                        ? "border-foreground bg-foreground text-background"
                        : "border-border text-muted-foreground hover:border-foreground/40",
                    )}
                  >
                    {s.toLowerCase()}
                  </button>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                disabled={updateStatus.isPending || selectedStatus === currentUser.status || isSelf || !canEdit}
                onClick={() => void updateStatus.mutateAsync({ status: selectedStatus })}
              >
                {updateStatus.isPending ? (
                  <><Spinner className="size-3.5" /> Updating…</>
                ) : "Apply status"}
              </Button>
              {updateStatus.isSuccess && (
                <p className="flex items-center gap-1 text-xs text-emerald-600">
                  <CheckCircle2 className="size-3" /> Status updated
                </p>
              )}
              {updateStatus.isError && (
                <p className="text-xs text-destructive">Update failed.</p>
              )}
            </CardContent>
          </Card>

          {/* Roles */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Roles</CardTitle>
              <CardDescription className="text-xs">
                {isSelf
                  ? "You cannot change your own roles."
                  : canEdit
                    ? "Toggle to assign or revoke."
                    : "Requires SUPER_ADMIN to change privileged accounts."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {roles.isLoading ? (
                <Spinner className="size-4" />
              ) : (
                <div className="space-y-1.5">
                  {assignableRoles.map((role) => {
                    const checked = selectedRoleIds.has(role.id);
                    const disabled = !canEditRoles;
                    return (
                      <button
                        key={role.id}
                        type="button"
                        disabled={disabled}
                        onClick={() => !disabled && toggleRole(role.id)}
                        className={cn(
                          "flex w-full items-center gap-2.5 rounded-lg border px-3 py-2.5 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-40",
                          checked
                            ? "border-foreground bg-foreground/5"
                            : "border-border hover:border-foreground/30",
                        )}
                      >
                        <span
                          className={cn(
                            "flex size-4 shrink-0 items-center justify-center rounded border-2 transition-colors",
                            checked ? "border-foreground bg-foreground" : "border-muted-foreground",
                          )}
                        >
                          {checked && (
                            <svg className="size-2.5 text-background" viewBox="0 0 10 10" fill="none">
                              <path d="M1.5 5L4 7.5L8.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-medium">{formatRoleName(role.name)}</p>
                          {typeof role.description === "string" && role.description ? (
                            <p className="truncate text-xs text-muted-foreground">{role.description}</p>
                          ) : null}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                disabled={replaceRoles.isPending || !canEditRoles}
                onClick={() => void replaceRoles.mutateAsync({ roleIds: Array.from(selectedRoleIds) })}
              >
                {replaceRoles.isPending ? (
                  <><Spinner className="size-3.5" /> Saving…</>
                ) : "Save roles"}
              </Button>
              {replaceRoles.isSuccess && (
                <p className="flex items-center gap-1 text-xs text-emerald-600">
                  <CheckCircle2 className="size-3" /> Roles updated
                </p>
              )}
              {replaceRoles.isError && (
                <p className="text-xs text-destructive">Update failed.</p>
              )}
            </CardContent>
          </Card>

          {/* Danger zone — hidden for self */}
          {!isSelf && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base text-destructive">
                  <Trash2 className="size-4" />
                  Danger zone
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!canEdit ? (
                  <p className="text-xs text-muted-foreground">
                    Only SUPER_ADMIN can delete privileged accounts.
                  </p>
                ) : confirmDelete ? (
                  <div className="space-y-3">
                    <p className="text-xs text-muted-foreground">
                      Permanently delete{" "}
                      <span className="font-medium text-foreground">{currentUser.displayName}</span>?
                      This cannot be undone.
                    </p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1" onClick={() => setConfirmDelete(false)}>
                        Cancel
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="flex-1"
                        disabled={deleteUser.isPending}
                        onClick={() => void deleteUser.mutateAsync()}
                      >
                        {deleteUser.isPending ? (
                          <><Spinner className="size-3.5" /> Deleting…</>
                        ) : "Confirm delete"}
                      </Button>
                    </div>
                    {deleteUser.isError && (
                      <p className="text-xs text-destructive">Delete failed.</p>
                    )}
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-destructive hover:border-destructive/50 hover:bg-destructive/5 hover:text-destructive"
                    onClick={() => setConfirmDelete(true)}
                  >
                    <Trash2 className="size-3.5" />
                    Delete user
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
