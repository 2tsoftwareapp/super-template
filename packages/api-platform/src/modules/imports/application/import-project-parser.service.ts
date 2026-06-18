import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { AppError, ERROR_CODES } from '@repo/api-core';

import type { ParsedProjectRow } from './imports.types';

import {
  OBJECT_STORAGE,
  type ObjectStorage,
} from '../../storage/application/object-storage.interface';

@Injectable()
export class ImportProjectParserService {
  constructor(@Inject(OBJECT_STORAGE) private readonly objectStorage: ObjectStorage) {}

  async parseImportFile(type: string, storageKey: string) {
    if (type !== 'projects') {
      throw new AppError(
        ERROR_CODES.VALIDATION_FAILED,
        `Unsupported import type "${type}"`,
        HttpStatus.BAD_REQUEST,
      );
    }

    const content = await this.objectStorage.read(storageKey);
    const lines = content
      .toString('utf8')
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    if (lines.length === 0) {
      return { rows: [] as ParsedProjectRow[] };
    }

    const [headerLine, ...dataLines] = lines;
    const headers = headerLine?.split(',').map((value) => value.trim()) ?? [];

    const rows = dataLines.map((line) => {
      const values = line.split(',').map((value) => value.trim());
      const record = Object.fromEntries(
        headers.map((header, index) => [header, values[index] ?? '']),
      );

      return {
        name: record.name ?? '',
        description: record.description ?? null,
        status: (record.status ?? 'DRAFT') as ParsedProjectRow['status'],
      };
    });

    return { rows };
  }

  validateProjectRows(rows: ParsedProjectRow[]) {
    const errors: Record<string, unknown>[] = [];

    rows.forEach((row, index) => {
      if (!row.name) {
        errors.push({ row: index + 1, message: 'name is required' });
      }

      if (!['DRAFT', 'ACTIVE', 'ARCHIVED'].includes(row.status)) {
        errors.push({ row: index + 1, message: 'status is invalid' });
      }
    });

    return errors;
  }
}
