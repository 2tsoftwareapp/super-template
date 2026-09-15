import { describe, expect, it } from "vitest";
import { CsvFormatError, parseCsvRecords } from "../csv";

describe("parseCsvRecords", () => {
  it("parses a plain LF file with a trailing newline", () => {
    expect(parseCsvRecords("name,email\nAlice,a@example.local\n")).toEqual([
      ["name", "email"],
      ["Alice", "a@example.local"],
    ]);
  });

  it("parses the last record without a trailing newline", () => {
    expect(parseCsvRecords("name,email\nAlice,a@example.local")).toEqual([
      ["name", "email"],
      ["Alice", "a@example.local"],
    ]);
  });

  it("parses CRLF records and keeps CRLF-free values", () => {
    expect(parseCsvRecords("name,email\r\nAlice,a@example.local\r\n")).toEqual([
      ["name", "email"],
      ["Alice", "a@example.local"],
    ]);
  });

  it("strips a leading UTF-8 BOM", () => {
    expect(parseCsvRecords("\uFEFFname,email\nAlice,a@example.local")).toEqual([
      ["name", "email"],
      ["Alice", "a@example.local"],
    ]);
  });

  it("keeps commas that are inside quoted fields", () => {
    expect(parseCsvRecords('name,address\nAlice,"1 Main St, Apt 4"')).toEqual([
      ["name", "address"],
      ["Alice", "1 Main St, Apt 4"],
    ]);
  });

  it("unescapes doubled quotes inside quoted fields", () => {
    expect(parseCsvRecords('name,note\nAlice,"She said ""hi"""')).toEqual([
      ["name", "note"],
      ["Alice", 'She said "hi"'],
    ]);
  });

  it("keeps line breaks that are inside quoted fields", () => {
    expect(parseCsvRecords('name,note\nAlice,"line 1\nline 2"')).toEqual([
      ["name", "note"],
      ["Alice", "line 1\nline 2"],
    ]);
  });

  it("keeps the spaces of a quoted field but trims unquoted ones", () => {
    expect(parseCsvRecords('name,note\n Alice , "  padded  "')).toEqual([
      ["name", "note"],
      ["Alice", "  padded  "],
    ]);
  });

  it("treats an empty quoted field as one field, not a blank line", () => {
    expect(parseCsvRecords('a,b\n"",')).toEqual([
      ["a", "b"],
      ["", ""],
    ]);
  });

  it("skips blank lines instead of turning them into rows", () => {
    expect(parseCsvRecords("name,email\n\nAlice,a@example.local\n\n")).toEqual([
      ["name", "email"],
      ["Alice", "a@example.local"],
    ]);
  });

  it("returns no records for empty or whitespace-only input", () => {
    expect(parseCsvRecords("")).toEqual([]);
    expect(parseCsvRecords("\n\n")).toEqual([]);
    expect(parseCsvRecords("   \n")).toEqual([]);
  });

  it("keeps trailing empty fields", () => {
    expect(parseCsvRecords("a,b,c\n1,,")).toEqual([
      ["a", "b", "c"],
      ["1", "", ""],
    ]);
  });

  it("rejects records with fewer fields than the header", () => {
    expect(() => parseCsvRecords("name,email\nAlice")).toThrowError(CsvFormatError);
    expect(() => parseCsvRecords("name,email\nAlice")).toThrowError(
      "CSV record 2 has 1 field(s) but the header has 2",
    );
  });

  it("rejects records with more fields than the header", () => {
    // The extra comma would previously be dropped silently.
    expect(() => parseCsvRecords("name,email\nAlice,a@example.local,extra")).toThrowError(
      /CSV record 2 has 3 field\(s\) but the header has 2/,
    );
  });

  it("reports the record number of the offending line", () => {
    expect(() => parseCsvRecords("a,b\n1,2\n3\n4,5")).toThrowError(/CSV record 3 has 1 field/);
  });

  it("rejects an unterminated quoted field", () => {
    expect(() => parseCsvRecords('name,note\nAlice,"unclosed')).toThrowError(
      /CSV record 2 has an unterminated quoted field/,
    );
  });

  it("exposes the record number on the error", () => {
    try {
      parseCsvRecords("a,b\n1,2\n3");
      throw new Error("expected parseCsvRecords to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(CsvFormatError);
      expect((error as CsvFormatError).record).toBe(3);
    }
  });
});
