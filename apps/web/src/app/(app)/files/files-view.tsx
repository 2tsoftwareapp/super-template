"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Download,
  History,
  Plus,
  Trash2,
  Upload,
  FileIcon,
  FolderOpen,
  Layers,
} from "lucide-react";
import { useQueryStates } from "nuqs";
import { useRef, useState } from "react";

import type { FileDto, FileHistoryEventDto, FileVersionDto, ListResponse } from "@/lib/api-types";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { webFetch } from "@/lib/http";
import { formatBytes, formatDateTime, timeAgo } from "@/lib/format";

const mimeTypeGroups = [
  { label: "All types", value: "" },
  { label: "Documents", value: "application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/csv" },
  { label: "Images", value: "image/" },
  { label: "Videos", value: "video/" },
  { label: "Audio", value: "audio/" },
  { label: "Archives", value: "application/zip,application/x-tar,application/gzip,application/x-7z-compressed" },
  { label: "Code", value: "text/javascript,text/typescript,text/html,text/css,application/json,text/x-python,text/x-java" },
];

const sortFieldOptions = [
  { label: "Date", value: "createdAt" },
  { label: "Name", value: "originalName" },
  { label: "Size", value: "sizeBytes" },
];

const sortOrderOptions = [
  { label: "Desc", value: "desc" },
  { label: "Asc", value: "asc" },
];

function mimeGroupLabel(value: string): string {
  return mimeTypeGroups.find((g) => g.value === value)?.label ?? value;
}

function formatMimeType(mime: string): string {
  const parts = mime.split("/");
  return parts[1]?.toUpperCase() ?? mime;
}

function FileRow({
  file,
  onDetail,
  onDelete,
}: {
  file: FileDto;
  onDetail: (file: FileDto) => void;
  onDelete: (file: FileDto) => void;
}) {
  const [urlLoading, setUrlLoading] = useState(false);
  const [url, setUrl] = useState<string | null>(null);

  const handleDownload = async () => {
    setUrlLoading(true);
    try {
      const res = await webFetch<{ data: { id: string; url: string; expiresInSeconds: number } }>(
        `/api/bff/files/${file.id}/url`,
      );
      setUrl(res.data.url);
      window.open(res.data.url, "_blank");
    } finally {
      setUrlLoading(false);
    }
  };

  return (
    <Card
      className="border-border transition hover:-translate-y-0.5 cursor-pointer"
      onClick={() => onDetail(file)}
    >
      <CardHeader className="flex-row items-start justify-between space-y-0">
        <div className="flex items-start gap-3 min-w-0">
          <div className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/50">
            <FileIcon className="size-5 text-muted-foreground" />
          </div>
          <div className="min-w-0 space-y-1">
            <CardTitle className="text-base truncate max-w-md">
              {file.originalName}
            </CardTitle>
            <CardDescription className="flex flex-wrap gap-x-3 gap-y-1">
              <span>{formatBytes(file.sizeBytes)}</span>
              <span>{formatMimeType(file.mimeType)}</span>
              <span>v{file.latestVersion}</span>
              <span>{timeAgo(file.createdAt)}</span>
            </CardDescription>
          </div>
        </div>
        <div className="flex shrink-0 gap-1" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="icon"
            title="Download"
            disabled={urlLoading}
            onClick={handleDownload}
          >
            {urlLoading ? <Spinner className="size-4" /> : <Download className="size-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            title="Delete"
            className="text-destructive hover:text-destructive"
            onClick={() => onDelete(file)}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </CardHeader>
    </Card>
  );
}

export function FilesView() {
  const [search, setSearch] = useState("");
  const [mimeType, setMimeType] = useState("");
  const [sortField, setSortField] = useState<"createdAt" | "originalName" | "sizeBytes">("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [selectedFile, setSelectedFile] = useState<FileDto | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const files = useQuery({
    queryKey: ["files", search, mimeType, sortField, sortOrder, page],
    queryFn: () => {
      const params = new URLSearchParams({
        limit: "20",
        page: String(page),
        sortField,
        sortOrder,
      });
      if (search) params.set("search", search);
      if (mimeType) params.set("mimeType", mimeType);
      return webFetch<ListResponse<FileDto>>(`/api/bff/files?${params.toString()}`);
    },
  });

  const versions = useQuery({
    queryKey: ["file-versions", selectedFile?.id],
    queryFn: () =>
      webFetch<{ data: FileVersionDto[] }>(
        `/api/bff/files/${selectedFile!.id}/versions`,
      ),
    enabled: !!selectedFile,
  });

  const history = useQuery({
    queryKey: ["file-history", selectedFile?.id],
    queryFn: () =>
      webFetch<{ data: FileHistoryEventDto[] }>(
        `/api/bff/files/${selectedFile!.id}/history`,
      ),
    enabled: !!selectedFile,
  });

  const deleteFile = useMutation({
    mutationFn: (fileId: string) =>
      webFetch(`/api/bff/files/${fileId}`, { method: "DELETE" }),
    onSuccess: () => {
      void files.refetch();
      setSelectedFile(null);
    },
  });

  const uploadFile = useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      return webFetch("/api/bff/files", {
        method: "POST",
        body: formData,
      });
    },
    onSuccess: () => {
      void files.refetch();
      setUploadOpen(false);
    },
  });

  const uploadVersion = useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      return webFetch(`/api/bff/files/${selectedFile!.id}/versions`, {
        method: "POST",
        body: formData,
      });
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <Badge variant="outline" className="w-fit">
            Files
          </Badge>
          <h1 className="text-4xl font-semibold">Files</h1>
        </div>
        <div className="flex gap-2">
          <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
            <DialogTrigger render={<Button><Upload className="mr-2 size-4" />Upload file</Button>} />
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload file</DialogTitle>
                <DialogDescription>
                  Select a file to upload to the storage.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <Label htmlFor="file-upload">File</Label>
                <Input
                  id="file-upload"
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) uploadFile.mutate(f);
                  }}
                />
                {uploadFile.isPending && <Spinner className="size-4" />}
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setUploadOpen(false)}
                >
                  Cancel
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-xl">Filters</CardTitle>
          <CardDescription>
            Search and filter your uploaded files.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-[minmax(0,1.6fr)_repeat(3,minmax(0,1fr))]">
          <div className="space-y-2">
            <Label htmlFor="search">Search</Label>
            <Input
              id="search"
              placeholder="Search by file name"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
            />
          </div>
          <div className="space-y-2">
            <Label>Type</Label>
            <Select
              value={mimeType}
              onValueChange={(value) => {
                setMimeType(value ?? "");
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                {mimeTypeGroups.map((group) => (
                  <SelectItem key={group.value} value={group.value}>
                    {group.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Sort field</Label>
            <Select
              value={sortField}
              onValueChange={(value) => {
                setSortField((value ?? "createdAt") as "createdAt" | "originalName" | "sizeBytes");
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sortFieldOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Sort order</Label>
            <Select
              value={sortOrder}
              onValueChange={(value) => {
                setSortOrder((value ?? "desc") as "asc" | "desc");
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sortOrderOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {files.isLoading ? (
          <Card className="border-border">
            <CardContent className="flex min-h-40 items-center justify-center">
              <Spinner className="size-5 text-primary" />
            </CardContent>
          </Card>
        ) : entries.length ? (
          entries.map((file) => (
            <FileRow
              key={file.id}
              file={file}
              onDetail={setSelectedFile}
              onDelete={(f) => {
                if (confirm(`Delete "${f.originalName}"?`)) {
                  deleteFile.mutate(f.id);
                }
              }}
            />
          ))
        ) : (
          <Card className="border-border">
            <CardContent className="py-10">
              <Empty className="border-border bg-muted/30">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <FolderOpen className="size-4" />
                  </EmptyMedia>
                  <EmptyTitle>No files found</EmptyTitle>
                  <EmptyDescription>
                    Try a different filter or upload a file.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="flex flex-col gap-3 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
        <p>
          Page {page} of {totalPages} ({total} total)
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage(Math.max(1, page - 1))}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={totalPages <= page}
            onClick={() => setPage(page + 1)}
          >
            Next
          </Button>
        </div>
      </div>

      <Sheet
        open={!!selectedFile}
        onOpenChange={(open) => {
          if (!open) setSelectedFile(null);
        }}
      >
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          {selectedFile && (
            <>
              <SheetHeader>
                <SheetTitle>{selectedFile.originalName}</SheetTitle>
                <SheetDescription>
                  {formatBytes(selectedFile.sizeBytes)} &middot;{" "}
                  {formatMimeType(selectedFile.mimeType)} &middot; v
                  {selectedFile.latestVersion} &middot;{" "}
                  {formatDateTime(selectedFile.createdAt)}
                </SheetDescription>
              </SheetHeader>

              <div className="mt-6 flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    const res = await webFetch<{ data: { url: string } }>(
                      `/api/bff/files/${selectedFile.id}/url`,
                    );
                    window.open(res.data.url, "_blank");
                  }}
                >
                  <Download className="mr-2 size-4" />
                  Download
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive"
                  onClick={() => {
                    if (confirm(`Delete "${selectedFile.originalName}"?`)) {
                      deleteFile.mutate(selectedFile.id);
                    }
                  }}
                >
                  <Trash2 className="mr-2 size-4" />
                  Delete
                </Button>
              </div>

              <div className="mt-4">
                <Label htmlFor="new-version">Upload new version</Label>
                <Input
                  id="new-version"
                  type="file"
                  className="mt-1"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) uploadVersion.mutate(f);
                  }}
                />
                {uploadVersion.isPending && <Spinner className="mt-2 size-4" />}
              </div>

              <Tabs defaultValue="versions" className="mt-6">
                <TabsList>
                  <TabsTrigger value="versions">
                    <Layers className="mr-2 size-4" />
                    Versions
                  </TabsTrigger>
                  <TabsTrigger value="history">
                    <History className="mr-2 size-4" />
                    History
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="versions" className="mt-4 space-y-2">
                  {versions.isLoading ? (
                    <Spinner className="size-4" />
                  ) : versions.data?.data.length ? (
                    versions.data.data.map((v) => (
                      <div
                        key={v.id}
                        className="flex items-center justify-between rounded-lg border border-border p-3 text-sm"
                      >
                        <div>
                          <span className="font-medium">v{v.versionNumber}</span>
                          <span className="ml-2 text-muted-foreground">
                            {formatBytes(v.sizeBytes)} &middot;{" "}
                            {timeAgo(v.createdAt)}
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
                </TabsContent>
                <TabsContent value="history" className="mt-4 space-y-2">
                  {history.isLoading ? (
                    <Spinner className="size-4" />
                  ) : history.data?.data.length ? (
                    history.data.data.map((event, i) => (
                      <div
                        key={i}
                        className="rounded-lg border border-border p-3 text-sm"
                      >
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="text-xs capitalize">
                            {event.action.replace(/_/g, " ")}
                          </Badge>
                          <span className="text-muted-foreground text-xs">
                            {timeAgo(event.createdAt)}
                          </span>
                        </div>
                        {event.metadata && typeof event.metadata === "object" && Object.keys(event.metadata as Record<string, unknown>).length > 0 && (
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
                </TabsContent>
              </Tabs>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
