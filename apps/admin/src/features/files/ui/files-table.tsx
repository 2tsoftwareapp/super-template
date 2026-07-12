import { Badge } from "@repo/web-core/components/badge";
import { Button } from "@repo/web-core/components/button";
import { SectionLoading } from "@repo/web-core/components/loading";
import { Show } from "@repo/web-core/components/show";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/web-core/components/table";
import { FileIcon, Trash2 } from "lucide-react";

import type { FileDto } from "@/lib/api-types";

import { formatBytes, formatMimeType } from "@/features/files/model/files-formatting";
import { timeAgo } from "@/lib/format";

interface FilesTableProps {
  files: FileDto[];
  isLoading: boolean;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onRowClick: (file: FileDto) => void;
  onDeleteClick: (file: FileDto) => void;
  hasFilters: boolean;
}

export function FilesTable({
  files,
  isLoading,
  page,
  totalPages,
  onPageChange,
  onRowClick,
  onDeleteClick,
  hasFilters,
}: FilesTableProps) {
  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Size</TableHead>
            <TableHead>Version</TableHead>
            <TableHead>Created</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          <Show when={isLoading}>
            <TableRow>
              <TableCell colSpan={6} className="py-16 text-center">
                <SectionLoading />
              </TableCell>
            </TableRow>
          </Show>
          {!isLoading && files.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={6}
                className="py-16 text-center text-sm text-muted-foreground"
              >
                {hasFilters
                  ? "No files match your filters."
                  : "No files uploaded yet."}
              </TableCell>
            </TableRow>
          ) : (
            files.map((file) => (
              <TableRow
                key={file.id}
                className="cursor-pointer"
                onClick={() => onRowClick(file)}
              >
                <TableCell className="font-medium text-sm">
                  <div className="flex items-center gap-2">
                    <FileIcon className="size-4 shrink-0 text-muted-foreground" />
                    <span className="truncate max-w-[260px]">
                      {file.originalName}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="text-xs">
                    {formatMimeType(file.mimeType)}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatBytes(file.sizeBytes)}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  v{file.latestVersion}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {timeAgo(file.createdAt)}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive"
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation();
                      onDeleteClick(file);
                    }}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-border px-4 py-3 text-sm">
          <p className="text-xs text-muted-foreground">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
