"use client";

import { Badge } from "@repo/web-ui/badge";
import { Button } from "@repo/web-ui/button";
import { createColumnHelper } from "@tanstack/react-table";
import { FileIcon, Trash2 } from "lucide-react";

import type { FileDto } from "@/lib/api-types";

import { timeAgo } from "@/lib/format";

const columnHelper = createColumnHelper<FileDto>();

export interface FilesColumnOptions {
  canDelete: boolean;
  formatBytes: (bytes: number) => string;
  formatMimeType: (mime: string) => string;
  onDeleteClick: (file: FileDto) => void;
}

export function createFilesColumns({
  canDelete,
  formatBytes,
  formatMimeType,
  onDeleteClick,
}: FilesColumnOptions) {
  return [
    columnHelper.accessor("originalName", {
      header: "Name",
      cell: ({ getValue }) => (
        <div className="flex items-center gap-2">
          <FileIcon className="size-4 shrink-0 text-muted-foreground" />
          <span className="max-w-[260px] truncate font-medium">{getValue()}</span>
        </div>
      ),
    }),
    columnHelper.accessor("mimeType", {
      header: "Type",
      cell: ({ getValue }) => (
        <Badge variant="secondary" className="text-xs">
          {formatMimeType(getValue())}
        </Badge>
      ),
    }),
    columnHelper.accessor("sizeBytes", {
      header: "Size",
      cell: ({ getValue }) => (
        <span className="text-sm text-muted-foreground">{formatBytes(getValue())}</span>
      ),
    }),
    columnHelper.accessor("latestVersion", {
      header: "Version",
      cell: ({ getValue }) => <span className="text-sm text-muted-foreground">v{getValue()}</span>,
    }),
    columnHelper.accessor("createdAt", {
      header: "Created",
      cell: ({ getValue }) => (
        <span className="text-sm text-muted-foreground">{timeAgo(getValue())}</span>
      ),
    }),
    columnHelper.display({
      id: "actions",
      header: () => null,
      cell: ({ row }) =>
        canDelete ? (
          <Button
            variant="ghost"
            size="icon"
            className="text-destructive"
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
              onDeleteClick(row.original);
            }}
          >
            <Trash2 className="size-4" />
          </Button>
        ) : null,
    }),
  ];
}
