// @vitest-environment jsdom
import type { AdminResourceConfig } from "@repo/web-utils/admin-resource";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { Database } from "lucide-react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CommonResourcePage } from "../common-resource-page";

const mockResource: AdminResourceConfig<typeof Database> = {
  id: "databases",
  label: "Databases",
  group: "System",
  path: "/admin/databases",
  icon: Database,
  features: ["list", "create", "show", "edit"],
  queryKey: "admin-databases",
};

describe("CommonResourcePage Component", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders header shell with resource title, description, and icon", () => {
    render(
      <CommonResourcePage
        resource={mockResource}
        title="Production Clusters"
        description="Manage all production database clusters"
      >
        <div>Main Cluster Content</div>
      </CommonResourcePage>,
    );

    expect(screen.getByText("Production Clusters")).toBeInTheDocument();
    expect(screen.getByText("Manage all production database clusters")).toBeInTheDocument();
    expect(screen.getByText("Main Cluster Content")).toBeInTheDocument();
  });

  it("renders header actions and refresh button when provided", () => {
    const handleRefresh = vi.fn();
    render(
      <CommonResourcePage
        resource={mockResource}
        description="Cluster list"
        headerActions={<button type="button">New Cluster</button>}
        onRefresh={handleRefresh}
      >
        <div>Content</div>
      </CommonResourcePage>,
    );

    expect(screen.getByRole("button", { name: "New Cluster" })).toBeInTheDocument();
    const refreshBtn = screen.getByRole("button", { name: /refresh/i });
    expect(refreshBtn).toBeInTheDocument();
    fireEvent.click(refreshBtn);
    expect(handleRefresh).toHaveBeenCalled();
  });

  it("renders stat cards when stats prop is supplied", () => {
    const stats = [
      { label: "Active Nodes", value: "32" },
      { label: "Storage Used", value: "1.4 TB" },
    ];

    render(
      <CommonResourcePage resource={mockResource} description="Stats demo" stats={stats}>
        <div>Content</div>
      </CommonResourcePage>,
    );

    expect(screen.getByText("Active Nodes")).toBeInTheDocument();
    expect(screen.getByText("32")).toBeInTheDocument();
    expect(screen.getByText("Storage Used")).toBeInTheDocument();
    expect(screen.getByText("1.4 TB")).toBeInTheDocument();
  });

  it("renders filter bar and bulk actions", () => {
    const handleClear = vi.fn();
    render(
      <CommonResourcePage
        resource={mockResource}
        description="Filters and Bulk"
        filterBar={<input placeholder="Search clusters..." />}
        bulkActions={{
          selectedCount: 3,
          onClear: handleClear,
          actions: <button type="button">Delete Selected</button>,
        }}
      >
        <div>Table with 3 rows selected</div>
      </CommonResourcePage>,
    );

    expect(screen.getByPlaceholderText("Search clusters...")).toBeInTheDocument();
    expect(screen.getByText("3 records selected")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Delete Selected" })).toBeInTheDocument();

    const clearBtn = screen.getByRole("button", { name: /clear selection/i });
    fireEvent.click(clearBtn);
    expect(handleClear).toHaveBeenCalled();
  });

  it("renders pagination controls", () => {
    const handlePageChange = vi.fn();
    render(
      <CommonResourcePage
        resource={mockResource}
        description="Pagination demo"
        pagination={{
          page: 1,
          pageSize: 10,
          total: 50,
          totalPages: 5,
          onPageChange: handlePageChange,
        }}
      >
        <div>Page 1 Content</div>
      </CommonResourcePage>,
    );

    expect(screen.getByText("1–10 of 50")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Next" })).toBeInTheDocument();
  });

  it("renders detail pane when provided", () => {
    render(
      <CommonResourcePage
        resource={mockResource}
        description="Detail demo"
        detailPane={<div data-testid="detail-drawer">Detail Pane Content</div>}
      >
        <div>Main content</div>
      </CommonResourcePage>,
    );

    expect(screen.getByTestId("detail-drawer")).toBeInTheDocument();
  });

  it("supports un-wrapped card container when cardWrapper is false", () => {
    const { container } = render(
      <CommonResourcePage resource={mockResource} description="No card wrapper" cardWrapper={false}>
        <div>Unwrapped content</div>
      </CommonResourcePage>,
    );

    expect(container.querySelector('[data-testid="common-resource-card-container"]')).toBeNull();
    expect(screen.getByText("Unwrapped content")).toBeInTheDocument();
  });
});
