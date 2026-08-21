import { describe, expect, it } from "vitest";

import {
  formatAuditAction,
  parseAuditLogsFilters,
  serializeAuditLogsFilters,
} from "../audit-logs.search-params";

describe("audit-logs.search-params", () => {
  it("uses defaults for an empty query string", () => {
    expect(parseAuditLogsFilters(new URLSearchParams())).toEqual({
      from: "",
      to: "",
      q: "",
      page: 1,
      sortOrder: "desc",
    });
  });

  it("parses filters from the URL and round-trips", () => {
    const sp = new URLSearchParams("from=2026-01-01&q=login&page=2&sortOrder=asc");
    const filters = parseAuditLogsFilters(sp);
    expect(filters.q).toBe("login");
    expect(filters.page).toBe(2);
    expect(filters.sortOrder).toBe("asc");

    const qs = serializeAuditLogsFilters({ ...filters, to: "" });
    expect(qs).toContain("q=login");
    expect(parseAuditLogsFilters(new URLSearchParams(qs)).page).toBe(2);
  });

  it("formats known audit actions readably", () => {
    expect(formatAuditAction("user.created")).toBe("User · Created");
  });
});
