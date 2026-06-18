import { describe, expect, it } from "vitest";

import { createTableSortBridge } from "@/lib/table-sort";

import type { UsersSortCriterion } from "./types";

import { paramsFromSortingState, sortingStateFromParams } from "./sorting";

const defaultSort: UsersSortCriterion[] = [{ field: "createdAt", order: "desc" }];

describe("users sorting helpers", () => {
  it("maps API sort params to table sorting state", () => {
    expect(
      sortingStateFromParams({
        sort: [{ field: "displayName", order: "asc" }],
      }),
    ).toEqual([{ id: "user", desc: false }]);
  });

  it("maps multiple API sort params to table sorting state", () => {
    expect(
      sortingStateFromParams({
        sort: [
          { field: "status", order: "asc" },
          { field: "createdAt", order: "desc" },
        ],
      }),
    ).toEqual([
      { id: "status", desc: false },
      { id: "createdAt", desc: true },
    ]);
  });

  it("maps table sorting state back to API sort params", () => {
    expect(
      paramsFromSortingState([{ id: "status", desc: true }], {
        sort: defaultSort,
      }),
    ).toEqual({ sort: [{ field: "status", order: "desc" }] });
  });

  it("preserves multi-column sort order from the table", () => {
    expect(
      paramsFromSortingState(
        [
          { id: "status", desc: false },
          { id: "email", desc: true },
        ],
        { sort: defaultSort },
      ),
    ).toEqual({
      sort: [
        { field: "status", order: "asc" },
        { field: "email", order: "desc" },
      ],
    });
  });
});

describe("createTableSortBridge", () => {
  it("reuses the same mapping for other resource tables", () => {
    const bridge = createTableSortBridge<"name" | "updatedAt">({
      fieldByColumn: { title: "name", updatedAt: "updatedAt" },
      columnByField: { name: "title", updatedAt: "updatedAt" },
    });

    expect(
      bridge.sortingStateFromParams([{ field: "name", order: "asc" }]),
    ).toEqual([{ id: "title", desc: false }]);
  });
});
