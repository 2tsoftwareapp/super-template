import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { ImportsViewModel } from "@/features/imports/model/imports.types";
import type { ImportJobDto } from "@/lib/api-types";

import { IMPORT_TYPES } from "@/features/imports/model/imports.constants";

import { ImportsListView } from "../imports-list-view";

const mockJob = {
  id: "imp-101",
  type: "users",
  status: "COMPLETED",
  fileId: "file-99999999",
  rowCount: 100,
  successCount: 98,
  errorCount: 2,
  createdAt: "2026-03-01T12:00:00Z",
  completedAt: "2026-03-01T12:05:00Z",
  confirmedAt: null,
  errors: [{ row: 5, message: "Invalid email" }],
} as unknown as ImportJobDto;

function TestHarness(props: Partial<ImportsViewModel>) {
  const defaultProps: ImportsViewModel = {
    form: {
      importTypes: IMPORT_TYPES,
      canCreate: true,
      isCreating: false,
      onSubmit: vi.fn(),
    },
    lookup: {
      jobId: "",
      onJobIdChange: vi.fn(),
      isFetching: false,
      onRefresh: vi.fn(),
    },
    job: {
      data: undefined,
      isLoading: false,
      isError: false,
      onRetry: vi.fn(),
      status: "",
    },
    confirm: {
      open: false,
      canConfirm: false,
      isConfirming: false,
      onOpen: vi.fn(),
      onCancel: vi.fn(),
      onConfirm: vi.fn(),
    },
    ...props,
  };

  return <ImportsListView {...defaultProps} />;
}

describe("ImportsListView", () => {
  it("renders Create import and Job detail cards", () => {
    render(<TestHarness />);
    expect(screen.getByText("Imports")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Create import jobs from uploaded files, inspect progress, and confirm when ready.",
      ),
    ).toBeInTheDocument();
    expect(screen.getAllByText("Create import").length).toBeGreaterThan(0);
    expect(screen.getByText("Job detail")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Import job ID")).toBeInTheDocument();
  });

  it("renders job data when job is loaded", () => {
    render(
      <TestHarness
        lookup={{
          jobId: "imp-101",
          onJobIdChange: vi.fn(),
          isFetching: false,
          onRefresh: vi.fn(),
        }}
        job={{
          data: mockJob,
          isLoading: false,
          isError: false,
          onRetry: vi.fn(),
          status: "COMPLETED",
        }}
        confirm={{
          open: false,
          canConfirm: true,
          isConfirming: false,
          onOpen: vi.fn(),
          onCancel: vi.fn(),
          onConfirm: vi.fn(),
        }}
      />,
    );
    expect(screen.getByText("users")).toBeInTheDocument();
    expect(screen.getByText("imp-101")).toBeInTheDocument();
    expect(screen.getByText("Confirm import")).toBeInTheDocument();
  });
});
