import { describe, expect, it } from "vitest";
import { isJsonObject, isJsonValue, parseJsonValue } from "../json";

describe("JSON utilities", () => {
  it("accepts recursively valid JSON values", () => {
    expect(isJsonValue({ count: 1, nested: [true, null, "ok"] })).toBe(true);
    expect(isJsonValue(new Date())).toBe(false);
  });

  it("rejects non-JSON values nested inside objects and arrays", () => {
    expect(isJsonValue({ value: undefined })).toBe(false);
    expect(isJsonValue(["ok", BigInt(1)])).toBe(false);
    expect(isJsonObject([])).toBe(false);
    expect(isJsonObject({})).toBe(true);
  });

  it("parses valid JSON and preserves non-JSON input as text", () => {
    expect(parseJsonValue('{"enabled":true}')).toEqual({ enabled: true });
    expect(parseJsonValue("not-json")).toBe("not-json");
    expect(parseJsonValue('"text"')).toBe("text");
  });
});
