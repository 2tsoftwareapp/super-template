import { describe, expect, it } from "vitest";

import { displayValue, initDraft, isObjectValue } from "../settings-drafts";

describe("settings-drafts", () => {
  const obj = { host: "x" };

  it("pretty-prints object values", () => {
    expect(displayValue(obj)).toBe(JSON.stringify(obj, null, 2));
    expect(initDraft(obj)).toBe(JSON.stringify(obj, null, 2));
  });

  it("renders nullish as em dash / empty draft", () => {
    expect(displayValue(null as never)).toBe("—");
    expect(displayValue(undefined as never)).toBe("—");
    expect(initDraft(null as never)).toBe("");
    expect(initDraft(undefined as never)).toBe("");
  });

  it("passes string values through at runtime", () => {
    // Runtime guard even though the contract types value as object.
    expect(displayValue("smtp.gmail.com" as never)).toBe("smtp.gmail.com");
    expect(initDraft("true" as never)).toBe("true");
  });

  it("detects object values", () => {
    expect(isObjectValue({})).toBe(true);
    expect(isObjectValue("text" as never)).toBe(false);
    expect(isObjectValue(null as never)).toBe(false);
  });
});
