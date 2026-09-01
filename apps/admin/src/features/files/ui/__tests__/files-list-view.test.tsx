import { getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { FilesViewModel } from "@/features/files/model/files.types";
import type { FileDto } from "@/lib/api-types";

import { FILE_MIME_OPTIONS } from "@/features/files/model/files.constants";

import { FilesListView } from "../files-list-view";

const mockFile = {
  id: "file-101",
  originalName: "report.pdf",
  mimeType: "application/pdf",
  sizeBytes: 1024 * 500,
  publicUrl: "https://example.com/report.pdf",
  createdAt: "2026-03-01T12:00:00Z",
  updatedAt: "2026-03-01T12:00:00Z",
  createdById: "usr-admin",
} as unknown as FileDto;

function TestHarness(props: Partial<FilesViewModel>) {
  // eslint-disable-next-line react-hooks/incompatible-library -- React Table standard hook
  const table = useReactTable({
    data: [mockFile],
    columns: [
      { accessorKey: "id", header: "ID" },
      { accessorKey: "originalName", header: "File Name" },
    ],
    getCoreRowModel: getCoreRowModel(),
  });

  const defaultProps: FilesViewModel = {
    header: {
      isFetching: false,
      total: 1,
      onRefresh: vi.fn(),
    },
    toolbar: {
      search: "",
      onSearchChange: vi.fn(),
      hasFilters: false,
      onClearFilters: vi.fn(),
      mimeFilter: "",
      onMimeFilterChange: vi.fn(),
      mimeOptions: FILE_MIME_OPTIONS,
      canUpload: true,
    },
    list: {
      isLoading: false,
      isError: false,
      onRetry: vi.fn(),
      files: [mockFile],
      page: 1,
      totalPages: 1,
      total: 1,
      onPageChange: vi.fn(),
      resultLabel: "1 file",
      onRowClick: vi.fn(),
      hasFilters: false,
      formatBytes: (bytes) => `${bytes} B`,
      formatMimeType: (mime) => mime,
    },
    upload: {
      isPending: false,
      onUpload: vi.fn(),
    },
    detail: {
      file: null,
      description: "File details",
      onClose: vi.fn(),
      onDownload: vi.fn(),
      onDelete: vi.fn(),
      canDelete: true,
      isDownloading: false,
    },
    versions: {
      data: [],
      isLoading: false,
      isError: false,
      onRetry: vi.fn(),
    },
    history: {
      data: [],
      isLoading: false,
      isError: false,
      onRetry: vi.fn(),
    },
    detailTabs: {
      activeTab: "versions",
      onTabChange: vi.fn(),
      uploadVersion: {
        isPending: false,
        onUpload: vi.fn(),
        canUpload: true,
      },
    },
    confirmDelete: {
      target: null,
      isPending: false,
      onCancel: vi.fn(),
      onConfirm: vi.fn(),
    },
    table,
    ...props,
  };

  return <FilesListView {...defaultProps} />;
}

describe("FilesListView", () => {
  it("renders the resource header, search input, and upload button", () => {
    render(<TestHarness />);
    expect(screen.getByText("Files")).toBeInTheDocument();
    expect(screen.getByText("Browse, upload, and manage file storage.")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Search by file name")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Upload/i })).toBeInTheDocument();
  });

  it("renders detail pane when file is selected", () => {
    render(
      <TestHarness
        detail={{
          file: mockFile,
          description: "File details",
          onClose: vi.fn(),
          onDownload: vi.fn(),
          onDelete: vi.fn(),
          canDelete: true,
          isDownloading: false,
        }}
      />,
    );
    expect(screen.getAllByText("report.pdf").length).toBeGreaterThan(0);
  });
});
