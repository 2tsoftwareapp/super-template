import { describe, expect, it } from "vitest";

import { resolveRequestId } from "../request-log.middleware";

describe("resolveRequestId", () => {
  it("keeps a well-formed incoming id so logs correlate across hops", () => {
    expect(resolveRequestId("bff-7f3a_01")).toBe("bff-7f3a_01");
  });

  it("replaces a missing, oversized or injected id with a fresh uuid", () => {
    for (const incoming of [undefined, "", "x".repeat(129), "id\nforged log line"]) {
      expect(resolveRequestId(incoming)).toMatch(/^[0-9a-f-]{36}$/);
    }
  });
});
