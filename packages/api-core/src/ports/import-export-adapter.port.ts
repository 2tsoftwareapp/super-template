import { HttpStatus, Injectable } from '@nestjs/common';
import type { TransactionExecutor } from '@repo/api-core';

import { ERROR_CODES } from '../common/constants/error-codes';
import { AppError } from '../common/errors/app-error';

export interface ImportExportRowContext {
  organizationId: string;
  ownerId: string;
  createdById: string;
}

export interface ImportValidationError {
  row: number;
  message: string;
}

export interface ImportExportAdapter<TRow extends object> {
  readonly type: string;
  readonly csvHeader: string[];

  readonly importPermissions?: string[];
  readonly exportPermissions?: string[];

  listForExport(params: {
    organizationId: string;
    ownerId: string;
  }): Promise<TRow[]>;

  toCsvRow(row: TRow): string[];

  parseCsvRecord(record: Record<string, string>): TRow;

  validateRow(row: TRow): string | null;

  importRow(row: TRow, context: ImportExportRowContext, executor?: TransactionExecutor): Promise<void>;
}

@Injectable()
export class ImportExportAdapterRegistry {
  private readonly adapters = new Map<string, ImportExportAdapter<object>>();

  register<TRow extends object>(adapter: ImportExportAdapter<TRow>): void {
    this.adapters.set(adapter.type, adapter);
  }

  resolve(type: string): ImportExportAdapter<object> {
    const adapter = this.adapters.get(type);

    if (!adapter) {
      throw new AppError(
        ERROR_CODES.VALIDATION_FAILED,
        `Unsupported import/export type "${type}"`,
        HttpStatus.BAD_REQUEST,
      );
    }

    return adapter;
  }

  getImportPermissions(type: string): string[] {
    return this.resolve(type).importPermissions ?? [];
  }

  getExportPermissions(type: string): string[] {
    return this.resolve(type).exportPermissions ?? [];
  }
}
