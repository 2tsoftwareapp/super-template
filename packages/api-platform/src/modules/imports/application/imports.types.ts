export type ImportJobStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED';

export interface ImportJobView {
  id: string;
  type: string;
  fileId: string;
  status: ImportJobStatus;
  rowCount: number | null;
  successCount: number | null;
  errorCount: number | null;
  errors: Record<string, unknown>[] | null;
  createdById: string;
  confirmedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateImportCommand {
  type: string;
  fileId: string;
  idempotencyKey?: string;
}

export interface ParsedProjectRow {
  name: string;
  description: string | null;
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
}
