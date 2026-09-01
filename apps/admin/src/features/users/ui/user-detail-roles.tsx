"use client";

import { Badge } from "@repo/web-ui/badge";
import { LoadingButton } from "@repo/web-ui/loading-button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/web-ui/select";
import { Show } from "@repo/web-ui/show";
import { Spinner } from "@repo/web-ui/spinner";
import { Building2, CheckCircle2, LockKeyhole, ShieldCheck } from "lucide-react";

import type { UserDetailViewModel } from "@/features/users/model/users.types";

import { formatRoleName } from "@/lib/roles";
import { cn } from "@/lib/utils";

interface UserDetailRolesProps {
  roles: UserDetailViewModel["roles"];
}

export function UserDetailRoles({ roles }: UserDetailRolesProps) {
  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-sm font-medium">Role &amp; Access Assignment</h4>
        <p className="text-xs text-muted-foreground mt-0.5">
          Assign a platform or organization-scoped role to control access permissions.
        </p>
      </div>

      <Show when={roles.organizations.length > 0}>
        <div className="space-y-1.5">
          <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Target Organization
          </label>
          <Select
            value={roles.selectedOrganizationId}
            onValueChange={roles.onOrganizationSelect}
            disabled={roles.disabled || roles.organizationsLoading}
          >
            <SelectTrigger className="w-full sm:w-80">
              <SelectValue placeholder="Select an organization">
                {roles.selectedOrganizationId ? (
                  <span className="flex items-center gap-2">
                    <Building2 className="size-4 shrink-0 text-muted-foreground" />
                    <span>
                      {roles.organizations.find((o) => o.id === roles.selectedOrganizationId)?.name}
                    </span>
                  </span>
                ) : (
                  "Select organization"
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {roles.organizations.map((org) => (
                <SelectItem key={org.id} value={org.id}>
                  {org.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {roles.orgRequired && !roles.selectedOrganizationId && (
            <p className="text-xs text-destructive">Organization is required for this role</p>
          )}
        </div>
      </Show>

      {roles.isLoading ? (
        <div className="flex items-center gap-2 py-4 text-xs text-muted-foreground">
          <Spinner className="size-4" />
          <span>Loading available roles…</span>
        </div>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {roles.options.map((role) => {
            const checked = roles.selectedRoleId === role.id;
            const isSystemRole =
              role.name === "SUPER_ADMIN" || role.name === "ADMIN" || role.name === "USER";
            return (
              <button
                key={role.id}
                type="button"
                disabled={roles.disabled}
                onClick={() => roles.onSelect(role.id)}
                className={cn(
                  "flex items-start gap-3 rounded-lg border p-3 text-left transition-all",
                  "disabled:cursor-not-allowed disabled:opacity-40",
                  checked
                    ? "border-primary bg-primary/5 shadow-xs ring-1 ring-primary/30"
                    : "border-border hover:border-foreground/30 hover:bg-muted/30",
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                    checked ? "border-primary bg-primary" : "border-muted-foreground",
                  )}
                >
                  {checked && <span className="size-1.5 rounded-full bg-background" />}
                </span>
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-sm font-medium text-foreground">
                      {formatRoleName(role.name)}
                    </span>
                    <Badge
                      variant={isSystemRole ? "secondary" : "outline"}
                      className="text-[10px] px-1.5 py-0 gap-1 font-normal"
                    >
                      {isSystemRole ? (
                        <LockKeyhole className="size-2.5" />
                      ) : (
                        <ShieldCheck className="size-2.5" />
                      )}
                      {role.scope || (isSystemRole ? "System" : "Custom")}
                    </Badge>
                  </div>
                  {typeof role.description === "string" && (
                    <p className="text-xs text-muted-foreground line-clamp-2">{role.description}</p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      <div className="flex items-center gap-3 pt-2">
        <LoadingButton
          variant="default"
          size="sm"
          disabled={!roles.canSave}
          onClick={roles.onSave}
          loading={roles.state.isPending}
        >
          Save role assignment
        </LoadingButton>
        {roles.state.isSuccess && (
          <span className="flex items-center gap-1 text-xs text-primary font-medium">
            <CheckCircle2 className="size-3.5" /> Saved
          </span>
        )}
        <Show when={roles.state.isError}>
          <span className="text-xs text-destructive">
            Save failed.{" "}
            <button type="button" className="underline" onClick={roles.onSave}>
              Retry
            </button>
          </span>
        </Show>
      </div>
    </div>
  );
}
