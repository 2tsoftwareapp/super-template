import { Button } from "@repo/web-ui/button";
import { ConfirmDialog } from "@repo/web-ui/confirm-dialog";
import { Show } from "@repo/web-ui/show";
import { Trash2 } from "lucide-react";

import type { UserDetailViewModel } from "@/features/users/model/users.types";

interface UserDetailDangerZoneProps {
  danger: UserDetailViewModel["danger"];
  displayName: string;
  canEdit: boolean;
}

export function UserDetailDangerZone({ danger, displayName, canEdit }: UserDetailDangerZoneProps) {
  return (
    <div className="space-y-3">
      <div>
        <h4 className="text-sm font-medium text-destructive flex items-center gap-2">
          <Trash2 className="size-4" /> Danger Zone
        </h4>
        <p className="text-xs text-muted-foreground mt-0.5">
          Soft-delete this user account. This immediately revokes active sessions and disables
          logins.
        </p>
      </div>

      {!canEdit ? (
        <p className="text-xs text-muted-foreground bg-muted/40 p-2.5 rounded-lg border border-border">
          Only SUPER_ADMIN can delete privileged accounts.
        </p>
      ) : (
        <>
          {danger.confirmOpen && (
            <ConfirmDialog
              open
              title="Delete user account"
              message={
                <>
                  Are you sure you want to delete{" "}
                  <span className="font-semibold text-foreground">{displayName}</span>? This will
                  disable access for this user.
                </>
              }
              confirmLabel={danger.state.isPending ? "Deleting…" : "Confirm delete"}
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
            <Trash2 className="size-3.5 mr-1" />
            Delete user
          </Button>
          <Show when={danger.state.isError}>
            <p className="text-xs text-destructive">
              Delete failed.{" "}
              <button type="button" className="underline" onClick={danger.onRetry}>
                Retry
              </button>
            </p>
          </Show>
        </>
      )}
    </div>
  );
}
