// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as React from "react";
import {
  createColumnHelper,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { AlertCircle } from "lucide-react";

import { ResourceDataTable } from "../resource-data-table";

beforeEach(() => {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

afterEach(() => {
  cleanup();
});

interface TestUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

const columnHelper = createColumnHelper<TestUser>();

const defaultColumns = [
  columnHelper.accessor("name", {
    header: "Name",
    cell: (info) => info.getValue(),
    enableSorting: true,
  }),
  columnHelper.accessor("email", {
    header: "Email",
    cell: (info) => info.getValue(),
    enableSorting: true,
  }),
  columnHelper.accessor("role", {
    header: "Role",
    cell: (info) => info.getValue(),
    enableHiding: true,
  }),
];

function TestTableWrapper({
  data = [
    { id: "1", name: "Alice", email: "alice@example.com", role: "Admin" },
    { id: "2", name: "Bob", email: "bob@example.com", role: "User" },
  ],
  columns = defaultColumns,
  initialSorting = [] as SortingState,
  ...props
}: {
  data?: TestUser[];
  columns?: ColumnDef<TestUser, string>[];
  initialSorting?: SortingState;
} & Partial<React.ComponentProps<typeof ResourceDataTable<TestUser>>>) {
  const [sorting, setSorting] = React.useState<SortingState>(initialSorting);

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return <ResourceDataTable table={table} {...props} />;
}

describe("ResourceDataTable", () => {
  it("renders table headers and row data", () => {
    render(<TestTableWrapper />);

    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Email")).toBeInTheDocument();
    expect(screen.getByText("Role")).toBeInTheDocument();

    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("alice@example.com")).toBeInTheDocument();
    expect(screen.getByText("Admin")).toBeInTheDocument();

    expect(screen.getByText("Bob")).toBeInTheDocument();
    expect(screen.getByText("bob@example.com")).toBeInTheDocument();
    expect(screen.getByText("User")).toBeInTheDocument();
  });

  it("handles sorting click on sortable column headers", () => {
    render(<TestTableWrapper />);

    const nameHeader = screen.getByRole("columnheader", { name: /Name/i });
    expect(nameHeader).toBeInTheDocument();

    // Click to sort ascending
    fireEvent.click(nameHeader);
    expect(nameHeader).toHaveAttribute("aria-sort", "ascending");

    // Click to sort descending
    fireEvent.click(nameHeader);
    expect(nameHeader).toHaveAttribute("aria-sort", "descending");
  });

  it("displays multi-sort priority badges when multiSort is true", () => {
    render(
      <TestTableWrapper
        initialSorting={[
          { id: "name", desc: false },
          { id: "email", desc: true },
        ]}
        multiSort={true}
      />,
    );

    // Priority badges "1" and "2" should appear in headers
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("renders skeleton rows when isLoading is true", () => {
    const { container } = render(<TestTableWrapper isLoading={true} loadingRowCount={4} />);

    // Should render 4 skeleton rows
    const skeletonElements = container.querySelectorAll('[data-slot="skeleton"]');
    expect(skeletonElements.length).toBe(4 * 3); // 4 rows * 3 columns
  });

  it("renders error state with retry action", () => {
    const handleRetry = vi.fn();
    render(
      <TestTableWrapper
        error={{
          title: "Failed to load data",
          description: "Network timeout occurred",
          onRetry: handleRetry,
        }}
      />,
    );

    expect(screen.getByText("Failed to load data")).toBeInTheDocument();
    expect(screen.getByText("Network timeout occurred")).toBeInTheDocument();

    const retryBtn = screen.getByRole("button", { name: "Retry" });
    fireEvent.click(retryBtn);
    expect(handleRetry).toHaveBeenCalled();
  });

  it("renders empty state when data is empty", () => {
    const handleAction = vi.fn();
    render(
      <TestTableWrapper
        data={[]}
        empty={{
          title: "No users found",
          description: "Create your first user to get started",
          icon: AlertCircle,
          action: { label: "Add User", onClick: handleAction },
        }}
      />,
    );

    expect(screen.getByText("No users found")).toBeInTheDocument();
    expect(screen.getByText("Create your first user to get started")).toBeInTheDocument();

    const addBtn = screen.getByRole("button", { name: "Add User" });
    fireEvent.click(addBtn);
    expect(handleAction).toHaveBeenCalled();
  });

  it("triggers onRowClick with original item data", () => {
    const handleRowClick = vi.fn();
    render(<TestTableWrapper onRowClick={handleRowClick} />);

    const aliceCell = screen.getByText("Alice");
    fireEvent.click(aliceCell);

    expect(handleRowClick).toHaveBeenCalledWith({
      id: "1",
      name: "Alice",
      email: "alice@example.com",
      role: "Admin",
    });
  });

  it("applies density styles and supports density controls", () => {
    const handleDensityChange = vi.fn();
    const { rerender } = render(
      <TestTableWrapper
        density="compact"
        enableDensityToggle={true}
        onDensityChange={handleDensityChange}
      />,
    );

    const densityBtn = screen.getByRole("button", { name: "Table density" });
    expect(densityBtn).toBeInTheDocument();

    rerender(
      <TestTableWrapper
        density="comfortable"
        enableDensityToggle={true}
        onDensityChange={handleDensityChange}
      />,
    );

    expect(screen.getByRole("button", { name: "Table density" })).toBeInTheDocument();
  });

  it("renders column visibility toggle button when enabled", () => {
    render(<TestTableWrapper enableColumnVisibility={true} />);

    const columnsBtn = screen.getByRole("button", { name: "Toggle columns" });
    expect(columnsBtn).toBeInTheDocument();
  });
});
