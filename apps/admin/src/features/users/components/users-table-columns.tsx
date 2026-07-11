"use client";

import { createColumnHelper } from "@tanstack/react-table";
import { BadgeCheck, XCircle } from "lucide-react";

import type { AdminUserDto } from "@/lib/api-types";

import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip } from "@/components/ui/tooltip";
import { formatDateTime, statusProps, timeAgo } from "@/lib/format";
import { formatRoleName } from "@/lib/roles";
import { cn } from "@/lib/utils";

import { ActionsDropdown } from "./actions-dropdown";

const columnHelper = createColumnHelper<AdminUserDto>();

export function createUsersTableColumns(options?: {
  canUpdate?: boolean;
  onActivate?: (userId: string) => void | Promise<void>;
  onBlock?: (userId: string) => void | Promise<void>;
  isDisabled?: boolean;
}) {
  const { canUpdate, onActivate, onBlock, isDisabled } = options ?? {};

  return [
    columnHelper.display({
      id: "select",
      header: ({ table }) => (
        <Checkbox
          aria-label="Select all users"
          checked={table.getIsAllPageRowsSelected()}
          onChange={table.getToggleAllPageRowsSelectedHandler()}
          onClick={(event) => event.stopPropagation()}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          aria-label={`Select ${row.original.displayName}`}
          checked={row.getIsSelected()}
          onChange={row.getToggleSelectedHandler()}
          onClick={(event) => event.stopPropagation()}
        />
      ),
      enableSorting: false,
    }),
    columnHelper.accessor("displayName", {
      id: "user",
      header: "User",
      enableSorting: true,
      cell: ({ row }) => (
        <div className="flex items-center gap-2.5 py-0.5">
          <Avatar name={row.original.displayName} size="sm" />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium leading-tight">
              {row.original.displayName}
            </p>
            <p className="truncate text-[11px] text-muted-foreground leading-tight">
              {row.original.email}
            </p>
          </div>
        </div>
      ),
    }),
    columnHelper.accessor("email", {
      header: "Email",
      enableSorting: true,
      meta: { className: "hidden md:table-cell" } as const,
      cell: ({ getValue }) => (
        <span className="text-sm text-foreground">{getValue()}</span>
      ),
    }),
    columnHelper.accessor("status", {
      header: "Status",
      enableSorting: true,
      cell: ({ getValue }) => {
        const status = getValue();
        const { variant, className } = statusProps(status);
        return (
          <Badge variant={variant} className={cn("capitalize text-[11px] px-1.5 py-0", className)}>
            {status.toLowerCase()}
          </Badge>
        );
      },
    }),
    columnHelper.accessor("id", {
      id: "verified",
      header: "Verified",
      enableSorting: false,
      cell: ({ row }) => {
        const verified = (row.original as Record<string, unknown>).emailVerifiedAt;
        if (verified && typeof verified === "string") {
          return (
            <Tooltip content={formatDateTime(verified)}>
              <span className="inline-flex items-center gap-1 text-xs text-primary">
                <BadgeCheck className="size-3.5" />
                Verified
              </span>
            </Tooltip>
          );
        }
        return (
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <XCircle className="size-3.5" />
            Unverified
          </span>
        );
      },
    }),
    columnHelper.accessor("roles", {
      header: "Roles",
      enableSorting: false,
      meta: { className: "hidden md:table-cell" } as const,
      cell: ({ getValue }) => {
        const roleNames = [...new Set(getValue())];
        if (!roleNames.length) {
          return <span className="text-xs text-muted-foreground">—</span>;
        }
        const visible = roleNames.slice(0, 2);
        const overflow = roleNames.length - 2;
        return (
          <div className="flex flex-wrap gap-1">
            {visible.map((role) => (
              <Badge key={role} variant="secondary" className="text-[11px] px-1.5 py-0">
                {formatRoleName(role)}
              </Badge>
            ))}
            {overflow > 0 ? (
              <span className="text-[11px] text-muted-foreground">+{overflow}</span>
            ) : null}
          </div>
        );
      },
    }),
    columnHelper.accessor("createdAt", {
      header: "Joined",
      enableSorting: true,
      meta: { className: "hidden md:table-cell" } as const,
      cell: ({ getValue }) => (
        <Tooltip content={formatDateTime(getValue())}>
          <span className="text-sm text-foreground">{timeAgo(getValue())}</span>
        </Tooltip>
      ),
    }),
    columnHelper.display({
      id: "actions",
      enableSorting: false,
      meta: { className: "w-10" } as const,
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => {
        const status = row.original.status;
        const items: { label: string; destructive?: boolean; onClick: () => void }[] = [];

        if (canUpdate && status !== "ACTIVE") {
          items.push({
            label: "Activate",
            onClick: () => { void onActivate?.(row.original.id); },
          });
        }
        if (canUpdate && status !== "BLOCKED") {
          items.push({
            label: "Block",
            destructive: true,
            onClick: () => { void onBlock?.(row.original.id); },
          });
        }

        if (items.length === 0) return null;

        return (
          <div onClick={(e) => e.stopPropagation()}>
            <ActionsDropdown items={items} disabled={isDisabled ?? false} />
          </div>
        );
      },
    }),
  ];
}
