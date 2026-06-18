import { createColumnHelper } from "@tanstack/react-table";

import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { formatRoleName } from "@/lib/roles";
import { formatDateTime, statusProps, timeAgo, truncateId } from "@/lib/format";
import { cn } from "@/lib/utils";

import type { AdminUserDto } from "../../lib/types";

const columnHelper = createColumnHelper<AdminUserDto>();

export function createUsersTableColumns() {
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
        <div className="flex items-center gap-3 py-0.5">
          <Avatar name={row.original.displayName} size="sm" />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{row.original.displayName}</p>
            <p className="truncate font-mono text-xs text-muted-foreground">
              {truncateId(row.original.id)}
            </p>
          </div>
        </div>
      ),
    }),
    columnHelper.accessor("email", {
      header: "Email",
      enableSorting: true,
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
          <Badge variant={variant} className={cn("capitalize", className)}>
            {status.toLowerCase()}
          </Badge>
        );
      },
    }),
    columnHelper.accessor("emailVerifiedAt", {
      id: "verified",
      header: "Email verified",
      enableSorting: false,
      cell: ({ getValue }) => {
        const verifiedAt = getValue();
        if (!verifiedAt || typeof verifiedAt !== "string") {
          return <span className="text-xs text-muted-foreground">No</span>;
        }

        return (
          <div className="min-w-0">
            <Badge variant="outline" className="text-xs">
              Yes
            </Badge>
            <p className="mt-1 text-xs text-muted-foreground">{timeAgo(verifiedAt)}</p>
          </div>
        );
      },
    }),
    columnHelper.accessor("roles", {
      header: "Roles",
      enableSorting: false,
      cell: ({ getValue }) => {
        const roleNames = [...new Set(getValue())];
        if (!roleNames.length) {
          return <span className="text-xs text-muted-foreground">None</span>;
        }
        return (
          <div className="flex flex-wrap gap-1">
            {roleNames.map((role) => (
              <Badge key={role} variant="secondary" className="text-xs">
                {formatRoleName(role)}
              </Badge>
            ))}
          </div>
        );
      },
    }),
    columnHelper.accessor("createdAt", {
      header: "Joined",
      enableSorting: true,
      cell: ({ getValue }) => (
        <div className="min-w-0">
          <p className="text-xs text-foreground">{timeAgo(getValue())}</p>
          <p className="text-xs text-muted-foreground">{formatDateTime(getValue())}</p>
        </div>
      ),
    }),
    columnHelper.accessor("updatedAt", {
      header: "Updated",
      enableSorting: false,
      cell: ({ getValue }) => (
        <div className="min-w-0">
          <p className="text-xs text-foreground">{timeAgo(getValue())}</p>
          <p className="text-xs text-muted-foreground">{formatDateTime(getValue())}</p>
        </div>
      ),
    }),
  ];
}
