"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Download,
  FileIcon,
  History,
  Layers,
  RefreshCw,
  Trash2,
  Upload,
} from "lucide-react";
import { useRef, useState } from "react";

import type {
  FileDto,
  FileHistoryEventDto,
  FileVersionDto,
  ListResponse,
} from "@/lib/api-types";

import { ResourceDrawer } from "@/components/resource-drawer";
import { ResourcePageShell } from "@/components/resource-page-shell";
import { ResourceToolbar } from "@/components/resource-toolbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { adminResources } from "@/lib/admin-resources";
import { formatDateTime, timeAgo, truncateId } from "@/lib/format";
import { webFetch } from "@/lib/http";
import { cn } from "@/lib/utils";

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0)} ${units[i]!}`;
}

function formatMimeType(mime: string): string {
  const parts = mime.split("/");
  return parts[1]?.toUpperCase() ?? mime;
}

const mimeOptions = [
  { value: "", label: "All types" },
  { value: "image/", label: "Image" },
  { value: "video/", label: "Video" },
  { value: "audio/", label: "Audio" },
  { value: "application/pdf", label: "PDF" },
  { value: "text/", label: "Text" },
] as const;

const tabOptions = [
  { value: "versions", label: "Versions", icon: Layers },
  { value: "history", label: "History", icon: History },
] as const;

export function FilesView() {
  const filesResource = adminResources.find((r) => r.id === "files")!;
  const [search, setSearch] = useState("");
  const [mimeFilter, setMimeFilter] = useState("");
  const [page, setPage] = useState(1);
  const [selectedFile, setSelectedFile] = useState<FileDto | null>(null);
  const [detailTab, setDetailTab] = useState<"versions" | "history">("versions");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const versionInputRef = useRef<HTMLInputElement>(null);

  const files = useQuery({
    queryKey: ["admin-files", search, mimeFilter, page],
    queryFn: () => {
      const params = new URLSearchParams({ limit: "50", page: String(page) });
      if (search) params.set("search", search);
      if (mimeFilter) params.set("mimeType", mimeFilter);
      return webFetch<ListResponse<FileDto>>(
        `/api/bff/admin/files?${params.toString()}`,
      );
    },
  });

  const versions = useQuery({
    queryKey: ["admin-file-versions", selectedFile?.id],
    queryFn: () =>
      webFetch<{ data: FileVersionDto[] }>(
        `/api/bff/admin/files/${selectedFile!.id}/versions`,
      ),
    enabled: !!selectedFile,
  });

  const history = useQuery({
    queryKey: ["admin-file-history", selectedFile?.id],
    queryFn: () =>
      webFetch<{ data: FileHistoryEventDto[] }>(
        `/api/bff/admin/files/${selectedFile!.id}/history`,
      ),
    enabled: !!selectedFile,
  });

  const deleteFile = useMutation({
    mutationFn: (id: string) =>
      webFetch(`/api/bff/admin/files/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      void files.refetch();
      setSelectedFile(null);
    },
  });

  const uploadFile = useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      return webFetch("/api/bff/admin/files", {
        method: "POST",
        body: formData,
      });
    },
    onSuccess: () => {
      void files.refetch();
    },
  });

  const uploadVersion = useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      return webFetch(
        `/api/bff/admin/files/${selectedFile!.id}/versions`,
        { method: "POST", body: formData },
      );
    },
    onSuccess: () => {
      void versions.refetch();
      void history.refetch();
      void files.refetch();
    },
  });

  const entries = files.data?.data ?? [];
  const totalPages = files.data?.meta?.totalPages ?? 1;
  const total = files.data?.meta?.total ?? 0;

  const hasFilters = Boolean(mimeFilter);

  const clearFilters = () => {
    setMimeFilter("");
    setPage(1);
  };

  return (
    <ResourcePageShell
      resource={filesResource}
      description="Browse, upload, and manage file storage."
      isRefreshing={files.isFetching}
      onRefresh={() => void files.refetch()}
    >
      <Card>
        <ResourceToolbar
          search={search}
          onSearchChange={(v: string) => {
            setSearch(v);
            setPage(1);
          }}
          searchPlaceholder="Search by file name"
          hasFilters={hasFilters}
          onClearFilters={clearFilters}
          filters={
            <div className="flex flex-wrap gap-2">
              <select
                value={mimeFilter}
                onChange={(e) => {
                  setMimeFilter(e.target.value);
                  setPage(1);
                }}
                className="flex h-9 w-[140px] rounded-md border border-border bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {mimeOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          }
          actions={
            <>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  const f = e.target.files?.[0];
                  if (f) uploadFile.mutate(f);
                }}
              />
              <Button
                size="sm"
                disabled={uploadFile.isPending}
                onClick={() => fileInputRef.current?.click()}
              >
                {uploadFile.isPending ? (
                  <Spinner data-icon="inline-start" />
                ) : (
                  <Upload data-icon="inline-start" />
                )}
                Upload
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => void files.refetch()}
                disabled={files.isFetching}
              >
                <RefreshCw
                  data-icon="inline-start"
                  className={cn(files.isFetching && "animate-spin")}
                />
                Refresh
              </Button>
            </>
          }
          {...(files.data
            ? {
                resultLabel: `${entries.length} files${total ? ` (${total} total)` : ""}`,
              }
            : {})}
        />
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Files</CardTitle>
          <CardDescription className="text-xs">
            {total} file{total !== 1 ? "s" : ""} stored
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 pb-1">
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
              {files.isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-16 text-center">
                    <Spinner className="mx-auto size-5" />
                  </TableCell>
                </TableRow>
              ) : entries.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="py-16 text-center text-sm text-muted-foreground"
                  >
                    {search || mimeFilter
                      ? "No files match your filters."
                      : "No files uploaded yet."}
                  </TableCell>
                </TableRow>
              ) : (
                entries.map((file) => (
                  <TableRow
                    key={file.id}
                    className="cursor-pointer"
                    onClick={() => {
                      setSelectedFile(file);
                      setDetailTab("versions");
                    }}
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
                          if (window.confirm(`Delete "${file.originalName}"?`)) {
                            deleteFile.mutate(file.id);
                          }
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
                  onClick={() => setPage(page - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <ResourceDrawer
        open={!!selectedFile}
        title={selectedFile?.originalName ?? ""}
        description={
          selectedFile
            ? `${formatBytes(selectedFile.sizeBytes)} \u00B7 ${formatMimeType(selectedFile.mimeType)} \u00B7 v${selectedFile.latestVersion}`
            : ""
        }
        onClose={() => setSelectedFile(null)}
        footer={
          selectedFile ? (
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={async () => {
                  const res = await webFetch<{ data: { url: string } }>(
                    `/api/bff/admin/files/${selectedFile.id}/url`,
                  );
                  window.open(res.data.url, "_blank");
                }}
              >
                <Download data-icon="inline-start" />
                Download
              </Button>
              <input
                type="file"
                ref={versionInputRef}
                className="hidden"
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  const f = e.target.files?.[0];
                  if (f) uploadVersion.mutate(f);
                }}
              />
              <Button
                size="sm"
                variant="outline"
                disabled={uploadVersion.isPending}
                onClick={() => versionInputRef.current?.click()}
              >
                {uploadVersion.isPending ? (
                  <Spinner data-icon="inline-start" />
                ) : (
                  <Upload data-icon="inline-start" />
                )}
                New version
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-destructive"
                onClick={() => {
                  if (confirm("Delete this file?")) {
                    deleteFile.mutate(selectedFile.id);
                  }
                }}
              >
                <Trash2 data-icon="inline-start" />
                Delete
              </Button>
            </div>
          ) : undefined
        }
      >
        {selectedFile && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground">ID</Label>
                <p className="text-sm font-mono">{truncateId(selectedFile.id)}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Uploaded by</Label>
                <p className="text-sm">{String(selectedFile.uploadedById ?? "\u2014")}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Created</Label>
                <p className="text-sm">{formatDateTime(selectedFile.createdAt)}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Updated</Label>
                <p className="text-sm">{formatDateTime(selectedFile.updatedAt)}</p>
              </div>
            </div>

            <Separator />

            {/* Tab buttons */}
            <div className="flex gap-1 border-b border-border pb-1">
              {tabOptions.map((tab) => {
                const TabIcon = tab.icon;
                return (
                  <Button
                    key={tab.value}
                    variant="ghost"
                    size="sm"
                    onClick={() => setDetailTab(tab.value)}
                    className={cn(
                      "relative rounded-b-none",
                      detailTab === tab.value &&
                        "after:absolute after:bottom-[-4px] after:left-0 after:h-[2px] after:w-full after:bg-primary",
                    )}
                  >
                    <TabIcon className="mr-2 size-4" />
                    {tab.label}
                  </Button>
                );
              })}
            </div>

            {/* Versions tab */}
            {detailTab === "versions" && (
              <div className="space-y-2">
                {versions.isLoading ? (
                  <Spinner className="size-4" />
                ) : versions.data?.data.length ? (
                  versions.data.data.map((v: FileVersionDto) => (
                    <div
                      key={v.id}
                      className="flex items-center justify-between rounded-lg border border-border p-3 text-sm"
                    >
                      <div>
                        <span className="font-medium">v{v.versionNumber}</span>
                        <span className="ml-2 text-muted-foreground">
                          {formatBytes(v.sizeBytes)} \u00B7 {timeAgo(v.createdAt)}
                        </span>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {formatMimeType(v.mimeType)}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No version history.
                  </p>
                )}
              </div>
            )}

            {/* History tab */}
            {detailTab === "history" && (
              <div className="space-y-2">
                {history.isLoading ? (
                  <Spinner className="size-4" />
                ) : history.data?.data.length ? (
                  history.data.data.map((event: FileHistoryEventDto, i: number) => (
                    <div
                      key={i}
                      className="rounded-lg border border-border p-3 text-sm"
                    >
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-xs capitalize">
                          {event.action.replace(/_/g, " ")}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {timeAgo(event.createdAt)}
                        </span>
                      </div>
                      {event.metadata &&
                        typeof event.metadata === "object" &&
                        Object.keys(event.metadata as Record<string, unknown>).length > 0 && (
                          <pre className="mt-2 overflow-x-auto rounded bg-muted p-2 text-xs">
                            {JSON.stringify(event.metadata, null, 2)}
                          </pre>
                        )}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No history events.
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </ResourceDrawer>
    </ResourcePageShell>
  );
}
