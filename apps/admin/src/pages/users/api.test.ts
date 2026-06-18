import { describe, expect, it } from "vitest";

import { buildUsersListPath } from "./api";

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
    ).toBe(
      "/api/v1/admin/users?page=1&limit=20&sortField=createdAt&sortOrder=desc",
    );
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
      "/api/v1/admin/users?page=2&limit=20&sortField=displayName&sortOrder=asc&sort=displayName%3Aasc%2CcreatedAt%3Adesc&search=jane&status=ACTIVE",
    );
  });
});
