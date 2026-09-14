import { Inject, Injectable } from "@nestjs/common";
import { OBJECT_STORAGE, type ObjectStorage } from "@repo/feature-upload/contracts";
import { createHash } from "node:crypto";

import type { ImportValidationError } from "../../../application/ports/import-export-adapter.port";

import { ImportExportAdapterRegistry } from "../../../application/services/import-export-adapter.registry";
import { parseCsvRecords } from "../../domain/csv";

export interface ParsedImportFile {
  rows: object[];
  /**
   * SHA-256 of the raw object bytes. Recorded on the import job when the file
   * is validated, then recomputed at confirm time so a file swapped in the
   * meantime is rejected instead of imported.
   */
  contentHash: string;
}

@Injectable()
export class ImportFileParserService {
  constructor(
    @Inject(OBJECT_STORAGE) private readonly objectStorage: ObjectStorage,
    private readonly importExportAdapters: ImportExportAdapterRegistry,
  ) {}

  async parseImportFile(type: string, storageKey: string): Promise<ParsedImportFile> {
    const adapter = this.importExportAdapters.resolve(type);
    const content = await this.objectStorage.read(storageKey);
    const contentHash = createHash("sha256").update(content).digest("hex");
    // RFC 4180 parsing (quoted fields, embedded commas/CRLF, BOM). Column counts
    // that do not line up with the header raise CsvFormatError.
    const records = parseCsvRecords(content.toString("utf8"));

    if (records.length === 0) {
      return { rows: [], contentHash };
    }

    const [headerRecord, ...dataRecords] = records;
    const headers = (headerRecord ?? []).map((header) => header.trim());

    const rows = dataRecords.map((record) => {
      const fields = Object.fromEntries(
        headers.map((header, index) => [header, record[index] ?? ""]),
      );

      return adapter.parseCsvRecord(fields);
    });

    return { rows, contentHash };
  }

  validateRows(type: string, rows: object[]): ImportValidationError[] {
    const adapter = this.importExportAdapters.resolve(type);
    const errors: ImportValidationError[] = [];

    rows.forEach((row, index) => {
      const message = adapter.validateRow(row);

      if (message) {
        errors.push({ row: index + 1, message });
      }
    });

    return errors;
  }
}
