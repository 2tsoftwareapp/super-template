"use client";

import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

const STATUS_OPTIONS = ["PENDING", "ACTIVE", "BLOCKED"] as const;
type UserStatus = (typeof STATUS_OPTIONS)[number];

export function StatusSection({
  userStatus,
  canEdit,
  isSelf,
  onApply,
  isUpdating,
  updateError,
  updateSuccess,
}: {
  userStatus: UserStatus;
  canEdit: boolean;
  isSelf: boolean;
  onApply: (status: UserStatus) => Promise<void>;
  isUpdating: boolean;
  updateError: boolean;
  updateSuccess: boolean;
}) {
  const [selected, setSelected] = useState<UserStatus>(userStatus);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelected(userStatus);
  }, [userStatus]);

  const disabled = isSelf || !canEdit || isUpdating;
  const isChanged = selected !== userStatus;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>Status</CardTitle>
        <CardDescription>
          {isSelf
            ? "Your account status is managed automatically."
            : canEdit
              ? "Change the account access level."
              : "Requires SUPER_ADMIN to change privileged accounts."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {!isSelf && !canEdit && (
          <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-400">
            <AlertTriangle className="size-3.5 shrink-0" />
            Requires SUPER_ADMIN to change privileged accounts.
          </div>
        )}
        <div className="flex flex-wrap items-center gap-1 rounded-lg border border-border p-1">
          {STATUS_OPTIONS.map((s) => {
            const isSelected = selected === s;
            return (
              <button
                key={s}
                type="button"
                disabled={disabled}
                onClick={() => setSelected(s)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors",
                  "disabled:cursor-not-allowed disabled:opacity-40",
                  isSelected
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                )}
              >
                {s.toLowerCase()}
              </button>
            );
          })}
        </div>
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          disabled={disabled || !isChanged}
          onClick={() => void onApply(selected)}
        >
          {isUpdating ? (
            <>
              <Spinner className="size-3.5" /> Updating…
            </>
          ) : (
            "Apply status"
          )}
        </Button>
        {updateSuccess && (
          <p className="flex items-center gap-1 text-xs text-emerald-600">
            <CheckCircle2 className="size-3" /> Status updated
          </p>
        )}
        {updateError && (
          <p className="flex items-center gap-1 text-xs text-destructive">
            Update failed.
            <button
              type="button"
              className="underline hover:no-underline"
              onClick={() => void onApply(selected)}
            >
              Retry
            </button>
          </p>
        )}
      </CardContent>
    </Card>
  );
}
