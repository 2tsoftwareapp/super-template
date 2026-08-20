import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { createTableSortBridge } from "@/lib/table-sort";

import { useResourceTableConfig } from "../use-resource-table-config";

interface TestRow {
  id: string;
  displayName: string;
  status: "ACTIVE" | "BLOCKED";
  createdAt: string;
}

type TestSortField = "createdAt" | "displayName" | "status";

const rows: TestRow[] = [
  { id: "u1", displayName: "Alice", status: "ACTIVE", createdAt: "2026-01-01" },
  { id: "u2", displayName: "Bob", status: "BLOCKED", createdAt: "2026-02-01" },
];

const sortBridge = createTableSortBridge<TestSortField>({
  fieldByColumn: {
    user: "displayName",
    email: "displayName",
    status: "status",
    createdAt: "createdAt",
  },
  columnByField: {
    displayName: "user",
    status: "status",
    createdAt: "createdAt",
  },
});

const columns = [
  { accessorKey: "user", header: "User", enableSorting: true },
  { accessorKey: "status", header: "Status", enableSorting: true },
] as never;

function defaultParams(sort: readonly { field: TestSortField; order: "asc" | "desc" }[]) {
  return { page: 1, limit: 50, sort };
}

describe("useResourceTableConfig", () => {
  it("derives sorting state from list params", () => {
    const { result } = renderHook(() =>
      useResourceTableConfig<TestRow, TestSortField>({
        data: rows,
        listParams: defaultParams([{ field: "createdAt", order: "desc" }]),
        sortBridge,
        columns,
        onSortChange: vi.fn(),
      }),
    );

    expect(result.current.table.getState().sorting).toEqual([{ id: "createdAt", desc: true }]);
  });

  it("syncs sort changes to params and clears selection", () => {
    const onSortChange = vi.fn();
    const { result } = renderHook(() =>
      useResourceTableConfig<TestRow, TestSortField>({
        data: rows,
        listParams: defaultParams([{ field: "createdAt", order: "desc" }]),
        sortBridge,
        columns,
        onSortChange,
      }),
    );

    act(() => {
      result.current.table.setRowSelection({ u1: true });
    });
    expect(result.current.selectedIds).toEqual(["u1"]);

    act(() => {
      result.current.table.getColumn("user")?.toggleSorting();
    });

    expect(onSortChange).toHaveBeenCalledWith([{ field: "displayName", order: "desc" }]);
    expect(result.current.selectedIds).toEqual([]);
  });

  it("keeps current sort when sorting is cleared to empty", () => {
    const onSortChange = vi.fn();
    const { result } = renderHook(() =>
      useResourceTableConfig<TestRow, TestSortField>({
        data: rows,
        listParams: defaultParams([{ field: "createdAt", order: "desc" }]),
        sortBridge,
        columns,
        onSortChange,
      }),
    );

    act(() => {
      result.current.table.setSorting([]);
    });

    expect(onSortChange).not.toHaveBeenCalled();
  });

  it("page-size change clears selection", () => {
    const onPageSizeChange = vi.fn();
    const { result } = renderHook(() =>
      useResourceTableConfig<TestRow, TestSortField>({
        data: rows,
        listParams: defaultParams([{ field: "createdAt", order: "desc" }]),
        sortBridge,
        columns,
        onSortChange: vi.fn(),
        onPageSizeChange,
      }),
    );

    act(() => {
      result.current.table.setRowSelection({ u1: true });
    });
    expect(result.current.selectedIds).toEqual(["u1"]);

    act(() => {
      result.current.handlePageSizeChange(20);
    });

    expect(onPageSizeChange).toHaveBeenCalledWith(20);
    expect(result.current.selectedIds).toEqual([]);
  });

  it("page change clears selection", () => {
    const onPageChange = vi.fn();
    const { result } = renderHook(() =>
      useResourceTableConfig<TestRow, TestSortField>({
        data: rows,
        listParams: defaultParams([{ field: "createdAt", order: "desc" }]),
        sortBridge,
        columns,
        onSortChange: vi.fn(),
        onPageChange,
      }),
    );

    act(() => {
      result.current.table.setRowSelection({ u1: true });
    });

    act(() => {
      result.current.handlePageChange(2);
    });

    expect(onPageChange).toHaveBeenCalledWith(2);
    expect(result.current.selectedIds).toEqual([]);
  });

  it("supports custom getRowId", () => {
    const { result } = renderHook(() =>
      useResourceTableConfig<TestRow, TestSortField>({
        data: rows,
        listParams: defaultParams([{ field: "createdAt", order: "desc" }]),
        sortBridge,
        columns,
        onSortChange: vi.fn(),
        getRowId: (row) => `row-${row.id}`,
      }),
    );

    act(() => {
      result.current.table.setRowSelection({ "row-u1": true });
    });

    expect(result.current.selectedIds).toEqual(["row-u1"]);
  });
});
