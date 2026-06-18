export interface CreateExportCommand {
  type: string;
  filters?: Record<string, unknown>;
  idempotencyKey?: string;
}
