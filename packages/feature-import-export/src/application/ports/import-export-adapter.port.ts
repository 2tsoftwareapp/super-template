import type { TransactionExecutor } from "@repo/api-kernel";

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
    /** Optional hard bound on rows returned; callers use it to cap memory. */
    limit?: number;
  }): Promise<TRow[]>;

  toCsvRow(row: TRow): string[];

  parseCsvRecord(record: Record<string, string>): TRow;

  validateRow(row: TRow): string | null;

  importRow(
    row: TRow,
    context: ImportExportRowContext,
    executor?: TransactionExecutor,
  ): Promise<void>;
}
