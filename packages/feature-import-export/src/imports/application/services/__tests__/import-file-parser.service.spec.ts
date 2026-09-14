import { createHash } from "node:crypto";

import { describe, expect, it, vi } from "vitest";

import { CsvFormatError } from "../../../domain/csv";
import { ImportFileParserService } from "../import-file-parser.service";

type CsvRecord = Record<string, string>;

function createService(content: string) {
  const objectStorage = {
    read: vi.fn(async () => Buffer.from(content, "utf8")),
  };
  const adapter = {
    parseCsvRecord: vi.fn((record: CsvRecord) => record),
    validateRow: vi.fn(() => null),
  };
  const registry = { resolve: vi.fn(() => adapter) };
  const service = new ImportFileParserService(objectStorage as never, registry as never);

  return { adapter, objectStorage, registry, service };
}

const sha256 = (value: string): string =>
  createHash("sha256").update(Buffer.from(value, "utf8")).digest("hex");

describe("ImportFileParserService.parseImportFile", () => {
  it("maps header columns onto rows and reads the file from object storage", async () => {
    const { adapter, objectStorage, service } = createService(
      "name,email\nAlice,a@example.local\nBob,b@example.local\n",
    );

    const result = await service.parseImportFile("users", "imports/test.csv");

    expect(objectStorage.read).toHaveBeenCalledWith("imports/test.csv");
    expect(result.rows).toEqual([
      { name: "Alice", email: "a@example.local" },
      { name: "Bob", email: "b@example.local" },
    ]);
    expect(adapter.parseCsvRecord).toHaveBeenCalledTimes(2);
  });

  it("fingerprints the raw bytes so confirm can detect a swapped file", async () => {
    const content = "name,email\nAlice,a@example.local";
    const { service } = createService(content);

    const result = await service.parseImportFile("users", "imports/test.csv");

    expect(result.contentHash).toBe(sha256(content));
  });

  it("keeps commas inside quoted fields instead of splitting on them", async () => {
    const { service } = createService('name,address\nAlice,"1 Main St, Apt 4"');

    const result = await service.parseImportFile("users", "imports/test.csv");

    expect(result.rows).toEqual([{ name: "Alice", address: "1 Main St, Apt 4" }]);
  });

  it("unescapes doubled quotes and keeps line breaks inside quoted fields", async () => {
    const { service } = createService('name,note\nAlice,"said ""hi""\nsecond line"');

    const result = await service.parseImportFile("users", "imports/test.csv");

    expect(result.rows).toEqual([{ name: "Alice", note: 'said "hi"\nsecond line' }]);
  });

  it("parses CRLF files with a BOM and skips blank lines", async () => {
    const { service } = createService("\uFEFFname,email\r\n\r\nAlice,a@example.local\r\n\r\n");

    const result = await service.parseImportFile("users", "imports/test.csv");

    expect(result.rows).toEqual([{ name: "Alice", email: "a@example.local" }]);
  });

  it("treats a file with only a header as an empty import", async () => {
    const { service } = createService("name,email\n");

    const result = await service.parseImportFile("users", "imports/test.csv");

    expect(result.rows).toEqual([]);
    expect(result.contentHash).toBe(sha256("name,email\n"));
  });

  it("treats an empty file as an empty import", async () => {
    const { service } = createService("");

    await expect(service.parseImportFile("users", "imports/test.csv")).resolves.toEqual({
      rows: [],
      contentHash: sha256(""),
    });
  });

  it("reports a row with too few columns instead of importing it", async () => {
    const { adapter, service } = createService("name,email\nAlice");

    await expect(service.parseImportFile("users", "imports/test.csv")).rejects.toThrowError(
      /CSV record 2 has 1 field\(s\) but the header has 2/,
    );
    expect(adapter.parseCsvRecord).not.toHaveBeenCalled();
  });

  it("reports a row with extra columns instead of silently dropping them", async () => {
    const { adapter, service } = createService("name,email\nAlice,a@example.local,ADMIN");

    await expect(service.parseImportFile("users", "imports/test.csv")).rejects.toBeInstanceOf(
      CsvFormatError,
    );
    expect(adapter.parseCsvRecord).not.toHaveBeenCalled();
  });

  it("still validates rows through the adapter", () => {
    const { adapter, service } = createService("");
    adapter.validateRow.mockReturnValueOnce("Email is required");

    expect(service.validateRows("users", [{ name: "Alice" }, { name: "Bob" }])).toEqual([
      { row: 1, message: "Email is required" },
    ]);
  });
});
