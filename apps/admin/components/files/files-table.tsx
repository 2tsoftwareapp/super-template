"use client";

import { ConfirmButton } from "@/components/confirm-button";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export interface StoredFile {
  id: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  uploaderId: string;
  createdAt: string;
}

const UNITS = ["B", "KB", "MB", "GB"];

export function formatBytes(bytes: number): string {
  let value = bytes;
  let unit = 0;

  while (value >= 1024 && unit < UNITS.length - 1) {
    value /= 1024;
    unit += 1;
  }

  return `${unit === 0 ? value : value.toFixed(1)} ${UNITS[unit]}`;
}

interface FilesTableProps {
  files: StoredFile[];
  onDelete: (file: StoredFile) => void;
}

export function FilesTable({ files, onDelete }: FilesTableProps) {
  if (files.length === 0) {
    return <p className="text-sm text-muted-foreground">No files uploaded yet.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Size</TableHead>
          <TableHead>Uploaded</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {files.map((file) => (
          <TableRow key={file.id}>
            <TableCell className="max-w-64 truncate font-medium">{file.originalName}</TableCell>
            <TableCell className="text-muted-foreground">{file.mimeType}</TableCell>
            <TableCell>{formatBytes(file.sizeBytes)}</TableCell>
            <TableCell>{new Date(file.createdAt).toLocaleString()}</TableCell>
            <TableCell>
              <div className="flex justify-end gap-2">
                <Button asChild variant="outline" size="sm">
                  <a href={`/api/files/${file.id}/download`}>Download</a>
                </Button>
                <ConfirmButton
                  label="Delete"
                  title={`Delete ${file.originalName}?`}
                  description="The file and its stored bytes are removed. This cannot be undone."
                  onConfirm={() => onDelete(file)}
                />
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
