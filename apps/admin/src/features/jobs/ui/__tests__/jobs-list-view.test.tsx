import { getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { JobsViewModel } from "@/features/jobs/model/jobs.types";
import type { JobDto, JobMetricsDto } from "@/lib/api-types";

import { STATUS_OPTIONS } from "@/features/jobs/model/jobs.constants";

import { JobsListView } from "../jobs-list-view";

const mockJob = {
  id: "job-101",
  type: "SEND_NOTIFICATION",
  status: "COMPLETED",
  payload: { userId: "123" },
  attempts: 1,
  maxAttempts: 3,
  errorMessage: null,
  createdAt: "2026-03-01T12:00:00Z",
  updatedAt: "2026-03-01T12:01:00Z",
  startedAt: "2026-03-01T12:00:10Z",
  completedAt: "2026-03-01T12:00:50Z",
  createdById: "usr-admin",
} as unknown as JobDto;

const mockMetrics = {
  totalCompleted: 42,
  totalFailed: 2,
  averageDurationMs: 1500,
  retryRate: 0.05,
  byStatus: [
    { status: "COMPLETED", total: 42 },
    { status: "FAILED", total: 2 },
    { status: "PENDING", total: 5 },
    { status: "PROCESSING", total: 1 },
  ],
  byType: [],
} as unknown as JobMetricsDto;

function TestHarness(props: Partial<JobsViewModel>) {
  // eslint-disable-next-line react-hooks/incompatible-library -- React Table standard hook
  const table = useReactTable({
    data: [mockJob],
    columns: [
      { accessorKey: "id", header: "ID" },
      { accessorKey: "type", header: "Type" },
    ],
    getCoreRowModel: getCoreRowModel(),
  });

  const defaultProps: JobsViewModel = {
    header: {
      metrics: mockMetrics,
      metricsLoading: false,
      metricsError: false,
      onRetryMetrics: vi.fn(),
      isFetching: false,
      onRefresh: vi.fn(),
    },
    filters: {
      status: "",
      type: "",
      statusOptions: STATUS_OPTIONS,
      onStatusChange: vi.fn(),
      onTypeChange: vi.fn(),
      hasFilters: false,
      onClearFilters: vi.fn(),
      onRefresh: vi.fn(),
      isFetching: false,
    },
    list: {
      total: 1,
      totalPages: 1,
      page: 1,
      isLoading: false,
      isFetching: false,
      isError: false,
      onRetry: vi.fn(),
      emptyMessage: "No jobs queued.",
      onPageChange: vi.fn(),
      statusProps: () => ({ variant: "default" as const }),
    },
    detail: {
      selectedJob: null,
      isOpen: false,
      detailLoading: false,
      detailError: false,
      onRetryDetail: vi.fn(),
      onOpen: vi.fn(),
      onClose: vi.fn(),
    },
    logs: {
      events: [],
      isLoading: false,
      isError: false,
      onRetry: vi.fn(),
    },
    cancel: {
      confirmId: null,
      isPending: false,
      onRequest: vi.fn(),
      onConfirm: vi.fn(),
      onDismiss: vi.fn(),
    },
    table,
    ...props,
  };

  return <JobsListView {...defaultProps} />;
}

describe("JobsListView", () => {
  it("renders the resource header, stat cards, and search input", () => {
    render(<TestHarness />);
    expect(screen.getByText("Jobs")).toBeInTheDocument();
    expect(screen.getByText("Completed")).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();
    expect(screen.getByText("Failed")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Job type (e.g. SEND_NOTIFICATION)")).toBeInTheDocument();
  });

  it("renders detail pane when open and job selected", () => {
    render(
      <TestHarness
        detail={{
          selectedJob: mockJob,
          isOpen: true,
          detailLoading: false,
          detailError: false,
          onRetryDetail: vi.fn(),
          onOpen: vi.fn(),
          onClose: vi.fn(),
        }}
      />,
    );
    expect(screen.getByText("Job detail")).toBeInTheDocument();
    expect(screen.getAllByText("job-101").length).toBeGreaterThan(0);
  });
});
