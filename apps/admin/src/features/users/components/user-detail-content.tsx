"use client";

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
import { LoadingButton } from "@repo/web-core/components/loading-button";
import { Separator } from "@repo/web-core/components/separator";
import { Show } from "@repo/web-core/components/show";
import { Spinner } from "@repo/web-core/components/spinner";
import {
  BadgeCheck,
  CheckCircle2,
  ShieldAlert,
  Trash2,
  XCircle,
} from "lucide-react";

import type { UserDetailViewModel } from "@/features/users/use-user-detail-controller";
import type { AdminUserDto } from "@/lib/api-types";

import { ResourcePageShell } from "@/components/resource-page-shell";
import { adminResources } from "@/lib/admin-resources";
import { statusProps, timeAgo, truncateId } from "@/lib/format";
import { cn } from "@/lib/utils";

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
  const { variant: sv, className: sc } = statusProps(user.status);
  const isVerified = Boolean(
    (user as Record<string, unknown>).emailVerifiedAt,
  );

  return (
    <ResourcePageShell
      resource={usersResource}
      title={user.displayName}
      description={`${user.email} · Joined ${timeAgo(user.createdAt)} · ID: ${truncateId(user.id)}`}
      meta={
        <>
          <Badge variant={sv} className={sc}>
            {user.status.toLowerCase()}
          </Badge>
          <Badge
            variant="outline"
            className={cn(
              "gap-1 text-[11px] px-1.5 py-0",
              isVerified
                ? "text-primary border-primary/30"
                : "text-muted-foreground",
            )}
          >
            {isVerified ? (
              <>
                <BadgeCheck className="size-3" /> Verified
              </>
            ) : (
              <>
                <XCircle className="size-3" /> Unverified
              </>
            )}
          </Badge>
          {user.roles.map((r) => (
            <Badge
              key={r}
              variant={r === "SUPER_ADMIN" || r === "ADMIN" ? "default" : "secondary"}
            >
              {r.toLowerCase().replace(/_/g, " ")}
            </Badge>
          ))}
          {flags.isSelf && <Badge variant="secondary">You</Badge>}
        </>
      }
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
          <div>
            <h4 className="mb-3 text-sm font-medium">Profile</h4>
            <form
              className="grid gap-4 sm:grid-cols-2"
              onSubmit={profile.onSubmit}
            >
              <div className="space-y-1.5">
                <Label htmlFor="p-name">Display name</Label>
                <Input
                  id="p-name"
                  {...profile.form.register("displayName")}
                  disabled={!flags.canEdit}
                />
                {profile.form.formState.errors.displayName && (
                  <p className="text-xs text-destructive">
                    {profile.form.formState.errors.displayName.message}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="p-email">Email</Label>
                <Input
                  id="p-email"
                  type="email"
                  {...profile.form.register("email")}
                  disabled={!flags.canEdit}
                />
                {profile.form.formState.errors.email && (
                  <p className="text-xs text-destructive">
                    {profile.form.formState.errors.email.message}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3 sm:col-span-2">
                <LoadingButton
                  type="submit"
                  loading={profile.state.isPending}
                  disabled={
                    !flags.canEdit ||
                    (!profile.form.formState.isDirty && !profile.state.isError)
                  }
                >
                  Save profile
                </LoadingButton>
                {profile.state.isSuccess && (
                  <span className="flex items-center gap-1 text-xs text-primary">
                    <CheckCircle2 className="size-3" /> Saved
                  </span>
                )}
                <Show when={profile.state.isError}>
                  <span className="text-xs text-destructive">Save failed.</span>
                </Show>
              </div>
            </form>
          </div>

          <Separator />

          <div>
            <h4 className="mb-3 text-sm font-medium">Status</h4>
            <div className="flex flex-wrap items-center gap-1 rounded-lg border border-border p-1">
              {status.options.map((s) => (
                <button
                  key={s}
                  type="button"
                  disabled={status.disabled}
                  onClick={() => status.onSelect(s)}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors",
                    "disabled:cursor-not-allowed disabled:opacity-40",
                    status.selected === s
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {s.toLowerCase()}
                </button>
              ))}
            </div>
            <div className="mt-3 flex items-center gap-3">
              <LoadingButton
                variant="outline"
                size="sm"
                disabled={!status.canApply}
                onClick={status.onApply}
                loading={status.state.isPending}
              >
                Apply status
              </LoadingButton>
              {status.state.isSuccess && (
                <span className="flex items-center gap-1 text-xs text-primary">
                  <CheckCircle2 className="size-3" /> Updated
                </span>
              )}
              <Show when={status.state.isError}>
                <span className="text-xs text-destructive">
                  Failed.{" "}
                  <button
                    type="button"
                    className="underline"
                    onClick={status.onApply}
                  >
                    Retry
                  </button>
                </span>
              </Show>
            </div>
          </div>

          <Separator />

          <div>
            <h4 className="mb-3 text-sm font-medium">Roles</h4>
            {roles.isLoading ? (
              <Spinner className="size-4" />
            ) : (
              <div className="space-y-1.5">
                {(["ADMIN", "USER"] as const).map((roleName) => {
                  const checked = roles.selected === roleName;
                  return (
                    <button
                      key={roleName}
                      type="button"
                      disabled={roles.disabled}
                      onClick={() => roles.onSelect(roleName)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors",
                        "disabled:cursor-not-allowed disabled:opacity-40",
                        checked
                          ? "border-foreground bg-foreground/5"
                          : "border-border hover:border-foreground/30",
                      )}
                    >
                      <span
                        className={cn(
                          "flex size-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                          checked
                            ? "border-foreground bg-foreground"
                            : "border-muted-foreground",
                        )}
                      >
                        {checked && (
                          <span className="size-1.5 rounded-full bg-background" />
                        )}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium">
                          {roleName.toLowerCase()}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {roleName === "ADMIN"
                            ? "Full access to all admin features."
                            : "Limited access based on assigned permissions."}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
            <div className="mt-3 flex items-center gap-3">
              <LoadingButton
                variant="outline"
                size="sm"
                disabled={!roles.canSave}
                onClick={roles.onSave}
                loading={roles.state.isPending}
              >
                Save roles
              </LoadingButton>
              {roles.state.isSuccess && (
                <span className="flex items-center gap-1 text-xs text-primary">
                  <CheckCircle2 className="size-3" /> Saved
                </span>
              )}
              <Show when={roles.state.isError}>
                <span className="text-xs text-destructive">
                  Failed.{" "}
                  <button
                    type="button"
                    className="underline"
                    onClick={roles.onSave}
                  >
                    Retry
                  </button>
                </span>
              </Show>
            </div>
          </div>

          {!flags.isSelf && (
            <>
              <Separator />
              <div>
                <h4 className="mb-3 text-sm font-medium text-destructive flex items-center gap-2">
                  <Trash2 className="size-4" /> Danger zone
                </h4>
                {!flags.canEdit ? (
                  <p className="text-xs text-muted-foreground">
                    Only SUPER_ADMIN can delete privileged accounts.
                  </p>
                ) : (
                  <>
                    {danger.confirmOpen && (
                      <ConfirmDialog
                        open
                        title="Delete user"
                        message={
                          <>
                            Permanently delete{" "}
                            <span className="font-medium text-foreground">
                              {user.displayName}
                            </span>
                            ? This cannot be undone.
                          </>
                        }
                        confirmLabel={
                          danger.state.isPending
                            ? "Deleting…"
                            : "Confirm delete"
                        }
                        destructive
                        loading={danger.state.isPending}
                        onCancel={danger.onCancel}
                        onConfirm={danger.onConfirm}
                      />
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:border-destructive/50 hover:bg-destructive/5 hover:text-destructive"
                      onClick={danger.onOpen}
                    >
                      <Trash2 className="size-3.5" />
                      Delete user
                    </Button>
                    <Show when={danger.state.isError}>
                      <p className="mt-2 text-xs text-destructive">
                        Delete failed.{" "}
                        <button
                          type="button"
                          className="underline"
                          onClick={danger.onRetry}
                        >
                          Retry
                        </button>
                      </p>
                    </Show>
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
