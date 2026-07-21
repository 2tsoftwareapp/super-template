"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/web-ui/card";
import { ConfirmDialog } from "@repo/web-ui/confirm-dialog";
import { useRef } from "react";

import type { FilesViewModel } from "@/features/files/model/files.types";

import { ResourcePageShell } from "@/components/resource-page-shell";
import { adminResources } from "@/lib/admin-resources";

import { FilesDetailDrawer } from "./files-detail-drawer";
import { FilesHeader } from "./files-header";
import { FilesTable } from "./files-table";

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
          <FilesHeader
            search={toolbar.search}
            onSearchChange={toolbar.onSearchChange}
            hasFilters={toolbar.hasFilters}
            onClearFilters={toolbar.onClearFilters}
            mimeFilter={toolbar.mimeFilter}
            onMimeFilterChange={toolbar.onMimeFilterChange}
            mimeOptions={toolbar.mimeOptions}
            isFetching={header.isFetching}
            onRefresh={header.onRefresh}
            isUploadPending={upload.isPending}
            onUploadClick={() => uploadFileRef.current?.click()}
            canUpload={toolbar.canUpload}
            resultLabel={list.resultLabel}
          />
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Files</CardTitle>
            <CardDescription className="text-xs">
              {list.total} file{list.total !== 1 ? "s" : ""} stored
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 pb-1">
            <FilesTable
              files={list.files}
              isLoading={list.isLoading}
              isError={list.isError}
              onRetry={list.onRetry}
              page={list.page}
              totalPages={list.totalPages}
              onPageChange={list.onPageChange}
              onRowClick={list.onRowClick}
              onDeleteClick={list.onDeleteClick}
              hasFilters={list.hasFilters}
              canDelete={list.canDelete}
              formatBytes={list.formatBytes}
              formatMimeType={list.formatMimeType}
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
          title={
            confirmDelete.target
              ? `Delete "${confirmDelete.target.originalName}"?`
              : ""
          }
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
