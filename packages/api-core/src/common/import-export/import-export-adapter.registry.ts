import { HttpStatus, Injectable } from "@nestjs/common";

import type { ImportExportAdapter } from "../../ports/import-export-adapter.port";

import { ERROR_CODES } from "../constants/error-codes";
import { AppError } from "../errors/app-error";

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
