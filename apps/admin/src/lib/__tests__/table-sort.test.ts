import { describe, expect, it } from "vitest";

import { createTableSortBridge } from "@/lib/table-sort";

describe("createTableSortBridge", () => {
  it("maps API sort params to table sorting state", () => {
    const bridge = createTableSortBridge<"createdAt" | "displayName" | "status">({
      fieldByColumn: { user: "displayName", status: "status", createdAt: "createdAt" },
      columnByField: { displayName: "user", status: "status", createdAt: "createdAt" },
    });

    expect(bridge.sortingStateFromParams([{ field: "displayName", order: "asc" }])).toEqual([
      { id: "user", desc: false },
    ]);
  });

  it("maps multiple API sort params to table sorting state", () => {
    const bridge = createTableSortBridge<"createdAt" | "displayName" | "status">({
      fieldByColumn: { user: "displayName", status: "status", createdAt: "createdAt" },
      columnByField: { displayName: "user", status: "status", createdAt: "createdAt" },
    });

    expect(
      bridge.sortingStateFromParams([
        { field: "status", order: "asc" },
        { field: "createdAt", order: "desc" },
      ]),
    ).toEqual([
      { id: "status", desc: false },
      { id: "createdAt", desc: true },
    ]);
  });

  it("maps table sorting state back to API sort params", () => {
    const bridge = createTableSortBridge<"createdAt" | "displayName" | "status">({
      fieldByColumn: { user: "displayName", status: "status", createdAt: "createdAt" },
      columnByField: { displayName: "user", status: "status", createdAt: "createdAt" },
    });

    expect(
      bridge.paramsFromSortingState(
        [{ id: "status", desc: true }],
        [{ field: "createdAt", order: "desc" }],
      ),
    ).toEqual([{ field: "status", order: "desc" }]);
  });

  it("preserves multi-column sort order from the table", () => {
    const bridge = createTableSortBridge<"createdAt" | "displayName" | "status">({
      fieldByColumn: { user: "displayName", status: "status", createdAt: "createdAt" },
      columnByField: { displayName: "user", status: "status", createdAt: "createdAt" },
    });

    expect(
      bridge.paramsFromSortingState(
        [
          { id: "status", desc: false },
          { id: "user", desc: true },
        ],
        [{ field: "createdAt", order: "desc" }],
      ),
    ).toEqual([
      { field: "status", order: "asc" },
      { field: "displayName", order: "desc" },
    ]);
  });

  it("reuses the same mapping for other resource tables", () => {
    const bridge = createTableSortBridge<"name" | "updatedAt">({
      fieldByColumn: { title: "name", updatedAt: "updatedAt" },
      columnByField: { name: "title", updatedAt: "updatedAt" },
    });

    expect(bridge.sortingStateFromParams([{ field: "name", order: "asc" }])).toEqual([
      { id: "title", desc: false },
    ]);
  });
});

describe("sortChanged", () => {
  it("is false for identical sort arrays", async () => {
    const { sortChanged } = await import("@/lib/table-sort");
    expect(
      sortChanged([{ field: "createdAt", order: "desc" }], [{ field: "createdAt", order: "desc" }]),
    ).toBe(false);
  });

  it("is true when sort differs", async () => {
    const { sortChanged } = await import("@/lib/table-sort");
    expect(
      sortChanged(
        [{ field: "createdAt", order: "desc" }],
        [{ field: "displayName", order: "asc" }],
      ),
    ).toBe(true);
  });
});
