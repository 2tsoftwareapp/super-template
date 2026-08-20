"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/web-ui/card";
import { ConfirmDialog } from "@repo/web-ui/confirm-dialog";
import { LoadingButton } from "@repo/web-ui/loading-button";
import { Pagination } from "@repo/web-ui/pagination";
import { Upload } from "lucide-react";
import { useRef } from "react";

import type { FilesViewModel } from "@/features/files/model/files.types";

import { ResourcePageShell } from "@/components/resource-page-shell";
import { ResourceTable } from "@/components/resource-table";
import { ResourceToolbar } from "@/components/resource-toolbar";
import { adminResources } from "@/lib/admin-resources";

import { FilesDetailDrawer } from "./files-detail-drawer";

export function FilesListView(viewModel: FilesViewModel) {
  const {
    header,
    toolbar,
    list,
    upload,
    detail,
    versions,
    history,
    detailTabs,
    confirmDelete,
    table,
  } = viewModel;
  const uploadFileRef = useRef<HTMLInputElement>(null);
  const versionFileRef = useRef<HTMLInputElement>(null);

  const filesResource = adminResources.find((r) => r.id === "files")!;

  return (
    <>
      <input
        type="file"
        ref={uploadFileRef}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) upload.onUpload(f);
          e.target.value = "";
        }}
      />
      <input
        type="file"
        ref={versionFileRef}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) detailTabs.uploadVersion.onUpload(f);
          e.target.value = "";
        }}
      />
      <ResourcePageShell
        resource={filesResource}
        description="Browse, upload, and manage file storage."
        isRefreshing={header.isFetching}
        onRefresh={header.onRefresh}
      >
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Files</CardTitle>
            <CardDescription className="text-xs">
              {list.total} file{list.total !== 1 ? "s" : ""} stored
            </CardDescription>
          </CardHeader>
          <ResourceToolbar
            search={toolbar.search}
            onSearchChange={toolbar.onSearchChange}
            searchPlaceholder="Search by file name"
            hasFilters={toolbar.hasFilters}
            onClearFilters={toolbar.onClearFilters}
            resultLabel={list.resultLabel}
            filters={
              <select
                className="h-9 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={toolbar.mimeFilter}
                onChange={(e) => toolbar.onMimeFilterChange(e.target.value)}
              >
                {toolbar.mimeOptions.map((opt) => (
                  <option key={opt.value || "all"} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            }
            actions={
              toolbar.canUpload ? (
                <LoadingButton
                  size="sm"
                  onClick={() => uploadFileRef.current?.click()}
                  loading={upload.isPending}
                >
                  <Upload data-icon="inline-start" />
                  Upload
                </LoadingButton>
              ) : null
            }
          />
          <CardContent className="p-0 pb-1">
            <ResourceTable
              table={table}
              isLoading={list.isLoading}
              {...(list.isError ? { error: { title: "Could not load files." } } : {})}
              onRetry={list.onRetry}
              onRowClick={(row) => list.onRowClick(row.original)}
              emptyTitle={
                list.hasFilters ? "No files match your filters." : "No files uploaded yet."
              }
            />
            <Pagination
              page={list.page}
              pageSize={50}
              totalPages={list.totalPages}
              total={list.total}
              isLoading={header.isFetching}
              onPageChange={list.onPageChange}
            />
          </CardContent>
        </Card>

        <FilesDetailDrawer
          file={detail.file}
          description={detail.description}
          onClose={detail.onClose}
          onDownload={detail.onDownload}
          onDelete={detail.onDelete}
          canDelete={detail.canDelete}
          isDownloading={detail.isDownloading}
          versionsData={versions.data}
          versionsLoading={versions.isLoading}
          versionsError={versions.isError}
          onRetryVersions={versions.onRetry}
          historyData={history.data}
          historyLoading={history.isLoading}
          historyError={history.isError}
          onRetryHistory={history.onRetry}
          activeTab={detailTabs.activeTab}
          onTabChange={detailTabs.onTabChange}
          onNewVersionClick={() => versionFileRef.current?.click()}
          isUploadingVersion={detailTabs.uploadVersion.isPending}
          canUploadVersion={detailTabs.uploadVersion.canUpload}
          formatBytes={list.formatBytes}
          formatMimeType={list.formatMimeType}
        />

        <ConfirmDialog
          open={!!confirmDelete.target}
          title={confirmDelete.target ? `Delete "${confirmDelete.target.originalName}"?` : ""}
          message="This action cannot be undone. The file and all its versions will be permanently removed."
          confirmLabel="Delete"
          destructive
          loading={confirmDelete.isPending}
          onCancel={confirmDelete.onCancel}
          onConfirm={confirmDelete.onConfirm}
        />
      </ResourcePageShell>
    </>
  );
}
