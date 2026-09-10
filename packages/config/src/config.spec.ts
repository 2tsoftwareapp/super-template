import { describe, expect, it } from "vitest";
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE, PAGE_SIZE_OPTIONS, appConfig } from "./index";

describe("shared app config", () => {
  it("keeps pagination defaults aligned with the canonical vocabulary", () => {
    expect(appConfig.pagination.defaultPageSize).toBe(DEFAULT_PAGE_SIZE);
    expect(appConfig.pagination.maxPageSize).toBe(MAX_PAGE_SIZE);
    expect(appConfig.pagination.pageSizeOptions).toEqual(PAGE_SIZE_OPTIONS);
  });

  it("uses an ordered page-size list with the maximum at the end", () => {
    expect(PAGE_SIZE_OPTIONS).toEqual([...PAGE_SIZE_OPTIONS].sort((a, b) => a - b));
    expect(MAX_PAGE_SIZE).toBe(Math.max(...PAGE_SIZE_OPTIONS));
  });
});
