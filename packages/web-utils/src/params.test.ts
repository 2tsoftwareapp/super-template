import { describe, expect, it } from "vitest";
import { z } from "zod";

import {
  booleanParam,
  dateParam,
  enumParam,
  internalPath,
  pageParam,
  pageSizeParam,
  parseRouteParams,
  parseSearchParams,
  searchTextParam,
  uuidParam,
} from "./params";

describe("parseRouteParams", () => {
  const schema = z.object({ id: uuidParam });

  it("accepts a well-formed id", () => {
    const result = parseRouteParams(schema, {
      id: "6f4d3a2b-1c8e-4f7a-9b2d-0e5c8a1f3b6d",
    });

    expect(result.ok).toBe(true);
  });

  it("rejects junk instead of guessing a fallback", () => {
    const result = parseRouteParams(schema, { id: "xx" });

    expect(result.ok).toBe(false);
    expect(result.ok === false && result.issues[0]).toContain("id");
  });
});

describe("parseSearchParams", () => {
  const schema = z.object({
    page: pageParam,
    limit: pageSizeParam([10, 20, 50], 20),
    status: enumParam(["all", "ACTIVE", "BLOCKED"], "all"),
    search: searchTextParam(10),
  });
  const fallback = { page: 1, limit: 20 as const, status: "all" as const, search: "" };

  it("keeps valid keys when another key is junk", () => {
    // The point of per-key recovery: ?page=xx must not discard the filter.
    const { data, recoveredKeys } = parseSearchParams(
      schema,
      new URLSearchParams("page=xx&status=ACTIVE"),
      fallback,
    );

    expect(data.status).toBe("ACTIVE");
    expect(data.page).toBe(1);
    expect(recoveredKeys).toContain("page");
  });

  it("falls back on out-of-range page sizes", () => {
    const { data } = parseSearchParams(
      schema,
      new URLSearchParams("limit=99999"),
      fallback,
    );

    expect(data.limit).toBe(20);
  });

  it("clamps over-long free text instead of throwing", () => {
    const { data } = parseSearchParams(
      schema,
      new URLSearchParams(`search=${"a".repeat(500)}`),
      fallback,
    );

    expect(data.search).toBe("");
  });

  it("returns clean data when everything is valid", () => {
    const { data, recoveredKeys } = parseSearchParams(
      schema,
      new URLSearchParams("page=3&limit=50&status=BLOCKED"),
      fallback,
    );

    expect(data).toMatchObject({ page: 3, limit: 50, status: "BLOCKED" });
    expect(recoveredKeys).toEqual([]);
  });
});

describe("boolean and date params", () => {
  const schema = z.object({ archived: booleanParam, from: dateParam });
  const fallback = { archived: false, from: undefined };

  it("reads only the literal \"true\" as true", () => {
    const yes = parseSearchParams(schema, new URLSearchParams("archived=true"), fallback);
    const junk = parseSearchParams(schema, new URLSearchParams("archived=1"), fallback);

    expect(yes.data.archived).toBe(true);
    expect(junk.data.archived).toBe(false);
    expect(junk.recoveredKeys).toContain("archived");
  });

  it("drops impossible dates", () => {
    const ok = parseSearchParams(schema, new URLSearchParams("from=2026-07-20"), fallback);
    const bad = parseSearchParams(schema, new URLSearchParams("from=not-a-date"), fallback);

    expect(ok.data.from).toBe("2026-07-20");
    expect(bad.data.from).toBeUndefined();
    expect(bad.recoveredKeys).toContain("from");
  });
});

describe("internalPath", () => {
  it("passes through same-origin paths", () => {
    expect(internalPath("/users?page=2", "/")).toBe("/users?page=2");
  });

  it.each([
    ["https://evil.com", "absolute URL"],
    ["//evil.com", "protocol-relative"],
    ["/\\evil.com", "backslash-obfuscated"],
    ["javascript:alert(1)", "scheme"],
    ["/users\nhttps://evil.com", "control character"],
    ["", "empty"],
    [null, "missing"],
  ])("rejects %s (%s)", (value: string | null, _reason: string) => {
    expect(internalPath(value, "/users")).toBe("/users");
  });
});
