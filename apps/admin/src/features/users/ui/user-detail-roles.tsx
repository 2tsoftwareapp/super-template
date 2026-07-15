import { LoadingButton } from "@repo/web-ui/loading-button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/web-ui/select";
import { Show } from "@repo/web-ui/show";
import { Spinner } from "@repo/web-ui/spinner";
import { Building2, CheckCircle2 } from "lucide-react";

import type { UserDetailViewModel } from "@/features/users/controllers/use-user-detail-controller";

import { formatRoleName } from "@/lib/roles";
import { cn } from "@/lib/utils";

interface UserDetailRolesProps {
  roles: UserDetailViewModel["roles"];
}

export function UserDetailRoles({ roles }: UserDetailRolesProps) {
  return (
    <div>
      <h4 className="mb-3 text-sm font-medium">Roles</h4>

      <Show when={roles.organizations.length > 0}>
        <div className="mb-4 space-y-1.5">
          <label className="text-sm font-medium">Organization</label>
          <Select
            value={roles.selectedOrganizationId}
            onValueChange={(value) => {
              if (value) roles.onOrganizationSelect(value);
            }}
            disabled={roles.organizationsLoading}
          >
            <SelectTrigger className="w-full">
              <Building2 className="size-3.5 shrink-0 text-muted-foreground" />
              <SelectValue placeholder="Select an organization..." />
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
            <p className="text-xs text-destructive">
              Organization is required for this role
            </p>
          )}
        </div>
      </Show>

      {roles.isLoading ? (
        <Spinner className="size-4" />
      ) : (
        <div className="space-y-1.5">
          {roles.options.map((role) => {
            const checked = roles.selectedRoleId === role.id;
            return (
              <button
                key={role.id}
                type="button"
                disabled={roles.disabled}
                onClick={() => roles.onSelect(role.id)}
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
                    {formatRoleName(role.name)}
                  </p>
                  {typeof role.description === "string" && (
                    <p className="text-xs text-muted-foreground">
                      {role.description}
                    </p>
                  )}
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
  );
}
