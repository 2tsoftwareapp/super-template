"use client";

import { CheckCircle2 } from "lucide-react";
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
import { formatRoleName } from "@/lib/roles";
import { cn } from "@/lib/utils";

export function RolesSection({
  currentRole,
  canEdit,
  isSelf,
  assignableRoleNames,
  rolesLoading,
  onSave,
  isSaving,
  saveError,
  saveSuccess,
}: {
  currentRole: "ADMIN" | "USER";
  canEdit: boolean;
  isSelf: boolean;
  assignableRoleNames: ("ADMIN" | "USER")[];
  rolesLoading: boolean;
  onSave: (role: "ADMIN" | "USER") => Promise<void>;
  isSaving: boolean;
  saveError: boolean;
  saveSuccess: boolean;
}) {
  const [selected, setSelected] = useState<"ADMIN" | "USER">(currentRole);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelected(currentRole);
  }, [currentRole]);

  const isChanged = selected !== currentRole;
  const canEditRole = !isSelf && canEdit;
  const disabled = !canEditRole || isSaving;

  const roleLabels: Record<string, string> = {
    ADMIN: "Full access to all admin features.",
    USER: "Limited access based on assigned permissions.",
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>Roles</CardTitle>
        <CardDescription>
          {isSelf
            ? "You cannot change your own roles."
            : canEdit
              ? "Select a role level."
              : "Requires SUPER_ADMIN to change privileged accounts."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {rolesLoading ? (
          <Spinner className="size-4" />
        ) : (
          <div className="space-y-1.5">
            {assignableRoleNames.map((roleName) => {
              const checked = selected === roleName;
              return (
                <button
                  key={roleName}
                  type="button"
                  role="radio"
                  aria-checked={checked}
                  disabled={disabled}
                  onClick={() => setSelected(roleName)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors",
                    "disabled:cursor-not-allowed disabled:opacity-40",
                    checked
                      ? "border-foreground bg-foreground/5"
                      : "border-border hover:border-foreground/30",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
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
                      {formatRoleName(roleName)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {roleLabels[roleName]}
                    </p>
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
          disabled={disabled || !isChanged}
          onClick={() => void onSave(selected)}
        >
          {isSaving ? (
            <>
              <Spinner className="size-3.5" /> Saving…
            </>
          ) : (
            "Save roles"
          )}
        </Button>
        {saveSuccess && (
          <p className="flex items-center gap-1 text-xs text-emerald-600">
            <CheckCircle2 className="size-3" /> Roles updated
          </p>
        )}
        {saveError && (
          <p className="flex items-center gap-1 text-xs text-destructive">
            Update failed.
            <button
              type="button"
              className="underline hover:no-underline"
              onClick={() => void onSave(selected)}
            >
              Retry
            </button>
          </p>
        )}
      </CardContent>
    </Card>
  );
}
