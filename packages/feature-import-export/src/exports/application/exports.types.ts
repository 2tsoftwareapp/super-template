import type { JsonObject } from "@repo/api-kernel";
export interface CreateExportCommand {
  type: string;
  filters?: JsonObject;
  idempotencyKey?: string;
}
