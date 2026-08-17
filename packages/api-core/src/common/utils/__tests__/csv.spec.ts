import { describe, expect, it } from "vitest";

import { escapeCsvValue, toCsv } from "../csv";

describe("escapeCsvValue", () => {
  it("passes through plain values unchanged", () => {
    expect(escapeCsvValue("hello")).toBe("hello");
  });

  it("quotes values containing commas, quotes, or newlines", () => {
    expect(escapeCsvValue("a,b")).toBe('"a,b"');
    expect(escapeCsvValue('a"b')).toBe('"a""b"');
    expect(escapeCsvValue("a\nb")).toBe('"a\nb"');
  });

  it("neutralizes formula-injection prefixes", () => {
    expect(escapeCsvValue("=SUM(A1:A2)")).toBe("'=SUM(A1:A2)");
    expect(escapeCsvValue("+1")).toBe("'+1");
    expect(escapeCsvValue("-1")).toBe("'-1");
    expect(escapeCsvValue("@cmd")).toBe("'@cmd");
  });
});

describe("toCsv", () => {
  it("joins a header and rows with escaping applied", () => {
    expect(
      toCsv(
        ["name", "note"],
        [
          ["Alice", "fine"],
          ["Bob", "a,b"],
        ],
      ),
    ).toBe('name,note\nAlice,fine\nBob,"a,b"');
  });
});
