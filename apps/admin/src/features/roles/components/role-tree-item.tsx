"use client";

import { Badge } from "@repo/web-core/components/badge";
import { Button } from "@repo/web-core/components/button";
import {
  ChevronDown,
  ChevronRight,
  LockKeyhole,
  Pencil,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { useState } from "react";

import type { ManagedRoleDto } from "@/features/roles/roles-schemas";

import { type MergedRole, optionalText } from "@/features/roles/roles-filtering";
import { formatRoleName } from "@/lib/roles";
import { cn } from "@/lib/utils";

interface RoleTreeItemProps {
  role: MergedRole;
  canUpdate: boolean;
  canDelete: boolean;
  isDeleting: boolean;
  deletingRoleId: string | null;
  onEdit: (role: ManagedRoleDto) => void;
  onDelete: (role: ManagedRoleDto) => void;
}

export function RoleTreeItem({
  role,
  canUpdate,
  canDelete,
  isDeleting,
  deletingRoleId,
  onEdit,
  onDelete,
}: RoleTreeItemProps) {
  const [expanded, setExpanded] = useState(false);
  const isEditable = !role.isSystem && (canUpdate || canDelete);

  return (
    <div className="border-b border-border last:border-b-0">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className={cn(
          "flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-muted/50",
        )}
      >
        <div className="shrink-0 rounded-lg border border-border bg-muted p-1.5">
          {role.isSystem ? (
            <LockKeyhole className="size-3.5 text-muted-foreground" />
          ) : (
            <ShieldCheck className="size-3.5 text-muted-foreground" />
          )}
        </div>
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <span className="truncate text-sm font-medium">
            {formatRoleName(role.name)}
          </span>
          {role.scopes.map((s) => (
            <Badge
              key={s}
              variant="outline"
              className="shrink-0 text-[10px] capitalize"
            >
              {s}
            </Badge>
          ))}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {isEditable && (
            <span
              className="flex items-center gap-0.5"
              onClick={(e) => e.stopPropagation()}
            >
              {canUpdate && (
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  aria-label={`Edit ${role.name}`}
                  onClick={() => onEdit(role)}
                  className="size-7"
                >
                  <Pencil className="size-3.5" />
                </Button>
              )}
              {canDelete && (
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  aria-label={`Delete ${role.name}`}
                  disabled={isDeleting}
                  onClick={() => onDelete(role)}
                  className={cn(
                    "size-7 hover:text-destructive",
                    deletingRoleId === role.id && "text-destructive",
                  )}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              )}
            </span>
          )}
          {expanded ? (
            <ChevronDown className="size-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="size-4 text-muted-foreground" />
          )}
        </div>
      </button>
      {expanded && (
        <div className="space-y-2 px-4 pb-3 pt-0">
          <p className="text-xs leading-relaxed text-muted-foreground">
            {optionalText(role.description) || "No description"}
          </p>
          {role.permissions.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {role.permissions.map((p) => (
                <Badge
                  key={p.id}
                  variant="secondary"
                  className="font-mono text-[10px]"
                >
                  {p.name}
                </Badge>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
