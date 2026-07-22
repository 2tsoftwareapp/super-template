import { describe, expect, it } from "vitest";

import { buildUsersListPath } from "../users.api";

describe("buildUsersListPath", () => {
  it("builds a paginated users list request with defaults", () => {
    expect(
      buildUsersListPath({
        page: 1,
        limit: 20,
        search: "",
        status: "all",
        sort: [{ field: "createdAt", order: "desc" }],
      }),
    ).toBe("/api/bff/admin/users");
  });

  it("includes search, status filters, and multi-field sort when provided", () => {
    expect(
      buildUsersListPath({
        page: 2,
        limit: 20,
        search: "  jane  ",
        status: "ACTIVE",
        sort: [
          { field: "displayName", order: "asc" },
          { field: "createdAt", order: "desc" },
        ],
      }),
    ).toBe(
      "/api/bff/admin/users?page=2&search=jane&status=ACTIVE&sortField=displayName&sortOrder=asc&sort=displayName%3Aasc%2CcreatedAt%3Adesc",
    );
  });
});
