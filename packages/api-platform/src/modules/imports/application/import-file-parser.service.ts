import { Inject, Injectable } from '@nestjs/common';
import { ImportExportAdapterRegistry } from '@repo/api-core';

import {
  OBJECT_STORAGE,
  type ObjectStorage,
} from '../../storage/application/object-storage.interface';

@Injectable()
export class ImportFileParserService {
  constructor(
    @Inject(OBJECT_STORAGE) private readonly objectStorage: ObjectStorage,
    private readonly importExportAdapters: ImportExportAdapterRegistry,
  ) {}

  async parseImportFile(type: string, storageKey: string) {
    const adapter = this.importExportAdapters.resolve(type);
    const content = await this.objectStorage.read(storageKey);
    const lines = content
      .toString('utf8')
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    if (lines.length === 0) {
      return { rows: [] as unknown[] };
    }

    const [headerLine, ...dataLines] = lines;
    const headers = headerLine?.split(',').map((value) => value.trim()) ?? [];

    const rows = dataLines.map((line) => {
      const values = line.split(',').map((value) => value.trim());
      const record = Object.fromEntries(
        headers.map((header, index) => [header, values[index] ?? '']),
      );

      return adapter.parseCsvRecord(record);
    });

    return { rows };
  }

  validateRows(type: string, rows: unknown[]) {
    const adapter = this.importExportAdapters.resolve(type);
    const errors: Record<string, unknown>[] = [];

    rows.forEach((row, index) => {
      const message = adapter.validateRow(row);

      if (message) {
        errors.push({ row: index + 1, message });
      }
    });

    return errors;
  }
}
