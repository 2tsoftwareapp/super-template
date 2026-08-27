import type { ImportValidationError } from "../../public/contracts";
export type ImportJobStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED" | "CANCELLED";

export interface ImportJobView {
  id: string;
  type: string;
  fileId: string;
  status: ImportJobStatus;
  rowCount: number | null;
  successCount: number | null;
  errorCount: number | null;
  errors: ImportValidationError[] | null;
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
