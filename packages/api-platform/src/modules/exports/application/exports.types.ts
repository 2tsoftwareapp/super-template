import type { JsonObject } from "@repo/api-core";
export interface CreateExportCommand {
  type: string;
  filters?: JsonObject;
  idempotencyKey?: string;
}
