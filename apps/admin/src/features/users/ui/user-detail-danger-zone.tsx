import { Button } from "@repo/web-core/components/button";
import { ConfirmDialog } from "@repo/web-core/components/confirm-dialog";
import { Show } from "@repo/web-core/components/show";
import { Trash2 } from "lucide-react";

import type { UserDetailViewModel } from "@/features/users/controllers/use-user-detail-controller";

interface UserDetailDangerZoneProps {
  danger: UserDetailViewModel["danger"];
  displayName: string;
  canEdit: boolean;
}

export function UserDetailDangerZone({
  danger,
  displayName,
  canEdit,
}: UserDetailDangerZoneProps) {
  return (
    <div>
      <h4 className="mb-3 text-sm font-medium text-destructive flex items-center gap-2">
        <Trash2 className="size-4" /> Danger zone
      </h4>
      {!canEdit ? (
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
                    {displayName}
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
  );
}
