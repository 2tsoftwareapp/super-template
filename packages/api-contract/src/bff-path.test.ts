import { describe, expect, it } from "vitest";

import { bffPath } from "./bff-path";

describe("bffPath", () => {
  it("maps /api/v1 to /api/bff", () => {
    expect(bffPath("/api/v1/files")).toBe("/api/bff/files");
  });

  it("fills path params", () => {
    expect(bffPath("/api/v1/files/{id}", { id: "abc-1" })).toBe(
      "/api/bff/files/abc-1",
    );
  });

  it("encodes path params", () => {
    expect(bffPath("/api/v1/files/{id}", { id: "a/b" })).toBe(
      "/api/bff/files/a%2Fb",
    );
  });

  it("throws when a path param is missing", () => {
    expect(() => bffPath("/api/v1/files/{id}")).toThrow(/Missing path params/);
  });
});
