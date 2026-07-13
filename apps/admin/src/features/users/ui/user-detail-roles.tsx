import { LoadingButton } from "@repo/web-core/components/loading-button";
import { Show } from "@repo/web-core/components/show";
import { Spinner } from "@repo/web-core/components/spinner";
import { CheckCircle2 } from "lucide-react";

import type { UserDetailViewModel } from "@/features/users/controllers/use-user-detail-controller";

import { cn } from "@/lib/utils";

interface UserDetailRolesProps {
  roles: UserDetailViewModel["roles"];
}

export function UserDetailRoles({ roles }: UserDetailRolesProps) {
  return (
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
  );
}
