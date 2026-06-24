"use client";

import { Trash2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export function DangerZone({
  displayName,
  canEdit,
  onDelete,
  isDeleting,
  deleteError,
}: {
  displayName: string;
  canEdit: boolean;
  onDelete: () => Promise<void>;
  isDeleting: boolean;
  deleteError: boolean;
}) {
  const [showConfirm, setShowConfirm] = useState(false);

  if (!canEdit) {
    return (
      <Card>
        <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-destructive">
          <Trash2 className="size-4" />
          Danger zone
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground">
          Only SUPER_ADMIN can delete privileged accounts.
        </p>
      </CardContent>
    </Card>
  );
}

  return (
    <>
      {showConfirm && (
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
          confirmLabel={isDeleting ? "Deleting…" : "Confirm delete"}
          destructive
          loading={isDeleting}
          onCancel={() => setShowConfirm(false)}
          onConfirm={async () => {
            await onDelete();
            setShowConfirm(false);
          }}
        />
      )}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="size-4" />
            Danger zone
          </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
          <Button
            variant="outline"
            size="sm"
            className="w-full text-destructive hover:border-destructive/50 hover:bg-destructive/5 hover:text-destructive"
            onClick={() => setShowConfirm(true)}
          >
            <Trash2 className="size-3.5" />
            Delete user
          </Button>
          {deleteError && (
            <p className="flex items-center gap-1 text-xs text-destructive">
              Delete failed.
              <button
                type="button"
                className="underline hover:no-underline"
                onClick={() => void onDelete()}
              >
                Retry
              </button>
            </p>
          )}
        </CardContent>
      </Card>
    </>
  );
}
