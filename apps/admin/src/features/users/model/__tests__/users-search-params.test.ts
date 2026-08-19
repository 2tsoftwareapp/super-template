import { describe, expect, it } from "vitest";

import { DEFAULT_USERS_LIST_PARAMS } from "../constants";
import {
  parseUsersListSearchParams,
  serializeUsersListSearchParams,
  usersListParamsEqual,
} from "../users.search-params";

describe("users search params", () => {
  it("uses defaults for an empty query string", () => {
    expect(parseUsersListSearchParams(new URLSearchParams())).toEqual({
      page: 1,
      limit: 20,
      search: "",
      status: "all",
      sort: [{ field: "createdAt", order: "desc" }],
    });
  });

  it("round-trips list filters through the URL", () => {
    const params = {
      page: 2,
      limit: 50 as const,
      search: "alice",
      status: "ACTIVE" as const,
      sort: [
        { field: "status" as const, order: "asc" as const },
        { field: "createdAt" as const, order: "desc" as const },
      ],
    };

    const serialized = serializeUsersListSearchParams(params).toString();
    expect(parseUsersListSearchParams(new URLSearchParams(serialized))).toEqual(params);
  });

  it("omits default values when serializing", () => {
    expect(
      serializeUsersListSearchParams({
        ...DEFAULT_USERS_LIST_PARAMS,
        limit: 20,
      }).toString(),
    ).toBe("");
  });

  it("compares list params including multi-sort", () => {
    const left = {
      page: 1,
      limit: 20 as const,
      search: "",
      status: "all" as const,
      sort: [{ field: "email" as const, order: "asc" as const }],
    };
    const right = {
      ...left,
      sort: [{ field: "email" as const, order: "desc" as const }],
    };

    expect(usersListParamsEqual(left, left)).toBe(true);
    expect(usersListParamsEqual(left, right)).toBe(false);
  });
});
