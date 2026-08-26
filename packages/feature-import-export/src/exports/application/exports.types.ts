import type { JsonObject } from "@repo/api-runtime";
export interface CreateExportCommand {
  type: string;
  filters?: JsonObject;
  idempotencyKey?: string;
}
