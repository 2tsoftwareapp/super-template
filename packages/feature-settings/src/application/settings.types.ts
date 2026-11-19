import type { JsonObject } from "@repo/api-kernel";

export interface UpdateSettingCommand {
  value: JsonObject;
}

/** Row shape of `applicationSettings`, as the mapper consumes it. */
export interface SettingRecord {
  key: string;
  value: Record<string, unknown>;
  updatedById: string | null;
  createdAt: Date;
  updatedAt: Date;
}
