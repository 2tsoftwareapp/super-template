// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, act } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as React from "react";

import {
  ResourceFilterBar,
  ResourceFacetedFilter,
  type ResourceFacetFilter,
} from "../resource-filter-bar";

beforeEach(() => {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("ResourceFilterBar", () => {
  it("renders search input and responds to typing", () => {
    const handleSearchChange = vi.fn();
    render(
      <ResourceFilterBar
        search={{
          value: "test query",
          onChange: handleSearchChange,
          placeholder: "Search users...",
        }}
      />,
    );

    const input = screen.getByRole("textbox", { name: "Search users..." });
    expect(input).toBeInTheDocument();
    expect(input).toHaveValue("test query");

    fireEvent.change(input, { target: { value: "new query" } });
    expect(handleSearchChange).toHaveBeenCalledWith("new query");
  });

  it("clears search when clear button is clicked", () => {
    const handleSearchChange = vi.fn();
    render(
      <ResourceFilterBar
        search={{
          value: "initial",
          onChange: handleSearchChange,
          placeholder: "Search...",
        }}
      />,
    );

    const clearButton = screen.getByRole("button", { name: "Clear search" });
    expect(clearButton).toBeInTheDocument();

    fireEvent.click(clearButton);
    expect(handleSearchChange).toHaveBeenCalledWith("");
  });

  it("handles debounced search input", () => {
    vi.useFakeTimers();
    const handleSearchChange = vi.fn();
    render(
      <ResourceFilterBar
        search={{
          value: "",
          onChange: handleSearchChange,
          placeholder: "Search...",
          debounceMs: 300,
        }}
      />,
    );

    const input = screen.getByRole("textbox", { name: "Search..." });
    fireEvent.change(input, { target: { value: "typing" } });

    // Should not call immediately
    expect(handleSearchChange).not.toHaveBeenCalled();

    // Advance timer
    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(handleSearchChange).toHaveBeenCalledWith("typing");
  });

  it("renders faceted filter triggers and selected counts", () => {
    const statusFacet: ResourceFacetFilter = {
      key: "status",
      label: "Status",
      options: [
        { label: "Active", value: "active", count: 12 },
        { label: "Pending", value: "pending", count: 5 },
        { label: "Archived", value: "archived", count: 2 },
      ],
      selectedValues: ["active", "pending"],
      onChange: vi.fn(),
    };

    render(<ResourceFilterBar facets={[statusFacet]} />);

    const trigger = screen.getByRole("button", { name: "Filter by Status" });
    expect(trigger).toBeInTheDocument();
    expect(screen.getByText("Status")).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
    expect(screen.getByText("Pending")).toBeInTheDocument();
  });

  it("renders active filter tags and triggers removal", () => {
    const onRemove = vi.fn();
    render(
      <ResourceFilterBar
        activeFilters={[
          { key: "f1", label: "Role: Admin", onRemove },
          { key: "f2", label: "Status: Active", onRemove: vi.fn() },
        ]}
        onClearAll={vi.fn()}
      />,
    );

    expect(screen.getByText("Role: Admin")).toBeInTheDocument();
    expect(screen.getByText("Status: Active")).toBeInTheDocument();

    const removeBtn = screen.getByRole("button", { name: "Remove filter Role: Admin" });
    fireEvent.click(removeBtn);
    expect(onRemove).toHaveBeenCalled();
  });

  it("automatically derives active filters from facets and dateRange", () => {
    const handleFacetChange = vi.fn();
    const handleDateRangeChange = vi.fn();

    const roleFacet: ResourceFacetFilter = {
      key: "role",
      label: "Role",
      options: [
        { label: "Admin", value: "admin" },
        { label: "User", value: "user" },
      ],
      selectedValues: ["admin"],
      onChange: handleFacetChange,
    };

    render(
      <ResourceFilterBar
        facets={[roleFacet]}
        dateRange={{
          from: "2026-01-01",
          to: "2026-01-31",
          onChange: handleDateRangeChange,
        }}
      />,
    );

    expect(screen.getByText("Role: Admin")).toBeInTheDocument();
    expect(screen.getByText("Date: 2026-01-01 – 2026-01-31")).toBeInTheDocument();

    const removeRoleBtn = screen.getByRole("button", { name: "Remove filter Role: Admin" });
    fireEvent.click(removeRoleBtn);
    expect(handleFacetChange).toHaveBeenCalledWith([]);

    const removeDateBtn = screen.getByRole("button", {
      name: "Remove filter Date: 2026-01-01 – 2026-01-31",
    });
    fireEvent.click(removeDateBtn);
    expect(handleDateRangeChange).toHaveBeenCalledWith({ from: "", to: "" });
  });

  it("calls onClearAll when Clear All is clicked", () => {
    const handleClearAll = vi.fn();
    render(
      <ResourceFilterBar
        activeFilters={[{ label: "Role: Admin", onRemove: vi.fn() }]}
        onClearAll={handleClearAll}
      />,
    );

    const clearAllBtn = screen.getByRole("button", { name: /Clear all/i });
    fireEvent.click(clearAllBtn);
    expect(handleClearAll).toHaveBeenCalled();
  });

  it("renders extra actions and children slots", () => {
    render(
      <ResourceFilterBar
        actions={<button type="button">Export Data</button>}
        children={<span data-testid="custom-filter">Custom Filter</span>}
      />,
    );

    expect(screen.getByText("Export Data")).toBeInTheDocument();
    expect(screen.getByTestId("custom-filter")).toBeInTheDocument();
  });
});

describe("ResourceFacetedFilter", () => {
  it("renders empty selection without badges", () => {
    render(
      <ResourceFacetedFilter
        title="Category"
        options={[
          { label: "Tech", value: "tech" },
          { label: "Design", value: "design" },
        ]}
        selectedValues={[]}
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByText("Category")).toBeInTheDocument();
    expect(screen.queryByText("selected")).not.toBeInTheDocument();
  });

  it("shows count badge when more than 2 items selected", () => {
    render(
      <ResourceFacetedFilter
        title="Tags"
        options={[
          { label: "A", value: "a" },
          { label: "B", value: "b" },
          { label: "C", value: "c" },
        ]}
        selectedValues={["a", "b", "c"]}
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByText("3 selected")).toBeInTheDocument();
  });
});
