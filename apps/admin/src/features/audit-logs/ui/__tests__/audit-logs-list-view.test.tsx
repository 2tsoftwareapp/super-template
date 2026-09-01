import { getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { AuditLogsViewModel } from "@/features/audit-logs/model/audit-logs.types";
import type { AuditLogDto } from "@/lib/api-types";

import { AuditLogsListView } from "../audit-logs-list-view";

const mockEntry: AuditLogDto = {
  id: "audit-123",
  action: "user.login",
  entityType: "User",
  entityId: "usr-456",
  actorId: "usr-admin",
  metadata: { ip: "127.0.0.1" },
  requestId: "req-789",
  ipAddress: "127.0.0.1",
  userAgent: "Mozilla/5.0",
  createdAt: "2026-03-01T12:00:00Z",
};

function TestHarness(props: Partial<AuditLogsViewModel>) {
  // eslint-disable-next-line react-hooks/incompatible-library -- React Table standard hook
  const table = useReactTable({
    data: [mockEntry],
    columns: [
      { accessorKey: "id", header: "ID" },
      { accessorKey: "action", header: "Action" },
    ],
    getCoreRowModel: getCoreRowModel(),
  });

  const defaultProps: AuditLogsViewModel = {
    filters: {
      from: "",
      to: "",
      q: "",
      page: 1,
      sortOrder: "desc",
    },
    hasFilters: false,
    onFilterChange: vi.fn(),
    onClearFilters: vi.fn(),
    isLoading: false,
    isRefreshing: false,
    hasError: false,
    onRefresh: vi.fn(),
    total: 1,
    totalPages: 1,
    selectedEntry: null,
    onSelectEntry: vi.fn(),
    onExport: vi.fn(),
    onExportJson: vi.fn(),
    isExporting: false,
    formatAction: (action) => action.toUpperCase(),
    table,
    ...props,
  };

  return <AuditLogsListView {...defaultProps} />;
}

describe("AuditLogsListView", () => {
  it("renders the resource header and search input", () => {
    render(<TestHarness />);
    expect(screen.getByText("Audit logs")).toBeInTheDocument();
    expect(screen.getByText("Who changed what, and when.")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Search events, actors, resources…")).toBeInTheDocument();
  });

  it("calls onExport when Export button is clicked", async () => {
    const user = userEvent.setup();
    const onExport = vi.fn();
    render(<TestHarness onExport={onExport} />);

    const exportBtn = screen.getByRole("button", { name: /^Export$/i });
    await user.click(exportBtn);
    expect(onExport).toHaveBeenCalledTimes(1);
  });

  it("renders detail pane when selectedEntry is provided", () => {
    render(<TestHarness selectedEntry={mockEntry} />);
    expect(screen.getByText("Event details")).toBeInTheDocument();
    expect(screen.getAllByText("audit-123").length).toBeGreaterThan(0);
    expect(screen.getByText("USER.LOGIN")).toBeInTheDocument();
  });
});
