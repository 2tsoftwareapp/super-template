"use client";

import { CommonResourcePage } from "@repo/web-ui/common-resource-page";
import { ConfirmDialog } from "@repo/web-ui/confirm-dialog";
import { LoadingButton } from "@repo/web-ui/loading-button";
import { ResourceDataTable } from "@repo/web-ui/resource-data-table";
import { ResourceFilterBar } from "@repo/web-ui/resource-filter-bar";
import { Upload } from "lucide-react";
import { useRef } from "react";

import type { FilesViewModel } from "@/features/files/model/files.types";

import { adminResources } from "@/features/_plugin-resources/admin-resources";

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
        aria-label="Upload file"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            upload.onUpload(file);
            e.target.value = "";
          }
        }}
      />
      <input
        type="file"
        ref={versionFileRef}
        className="hidden"
        aria-label="Upload new version"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            detailTabs.uploadVersion.onUpload(file);
            e.target.value = "";
          }
        }}
      />

      <CommonResourcePage
        resource={filesResource}
        description="Browse, upload, and manage file storage."
        isRefreshing={header.isFetching}
        onRefresh={header.onRefresh}
        filterBar={
          <ResourceFilterBar
            search={{
              value: toolbar.search,
              onChange: toolbar.onSearchChange,
              placeholder: "Search by file name",
            }}
            facets={[
              {
                key: "mime",
                label: "MIME type",
                options: toolbar.mimeOptions
                  .filter((opt) => opt.value !== "")
                  .map((opt) => ({
                    label: opt.label,
                    value: opt.value,
                  })),
                selectedValues: toolbar.mimeFilter ? [toolbar.mimeFilter] : [],
                onChange: (values) => {
                  toolbar.onMimeFilterChange(values[values.length - 1] ?? "");
                },
              },
            ]}
            onClearAll={toolbar.onClearFilters}
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
        }
        pagination={{
          page: list.page,
          pageSize: 50,
          total: list.total,
          totalPages: list.totalPages,
          isLoading: header.isFetching,
          onPageChange: list.onPageChange,
        }}
        detailPane={
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
        }
      >
        <ResourceDataTable
          table={table}
          isLoading={list.isLoading}
          error={
            list.isError ? { title: "Could not load files.", onRetry: list.onRetry } : undefined
          }
          onRowClick={(row) => list.onRowClick(row)}
          empty={{
            title: list.hasFilters ? "No files match your filters." : "No files uploaded yet.",
          }}
        />
      </CommonResourcePage>

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
    </>
  );
}
