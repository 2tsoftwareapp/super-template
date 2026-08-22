import { describe, expect, it } from "vitest";

import { AppError } from "../../errors/app-error";
import type { ImportExportAdapter } from "../../../ports/import-export-adapter.port";

import { ImportExportAdapterRegistry } from "../import-export-adapter.registry";

interface Row {
  name: string;
}

const adapter: ImportExportAdapter<Row> = {
  type: "users",
  csvHeader: ["name"],
  importPermissions: ["imports.create"],
  exportPermissions: ["exports.read"],
  listForExport: async () => [],
  toCsvRow: (row) => [row.name],
  parseCsvRecord: (record) => ({ name: record.name ?? "" }),
  validateRow: () => null,
  importRow: async () => {},
};

describe("ImportExportAdapterRegistry", () => {
  it("registers and resolves an adapter by type", () => {
    const registry = new ImportExportAdapterRegistry();
    registry.register(adapter);
    expect(registry.resolve("users")).toBe(adapter);
  });

  it("throws AppError VALIDATION_FAILED for unknown types", () => {
    const registry = new ImportExportAdapterRegistry();
    expect(() => registry.resolve("nope")).toThrow(AppError);
  });

  it("exposes import/export permissions with empty defaults", () => {
    const registry = new ImportExportAdapterRegistry();
    registry.register(adapter);
    expect(registry.getImportPermissions("users")).toEqual(["imports.create"]);
    expect(registry.getExportPermissions("users")).toEqual(["exports.read"]);

    const bare = new ImportExportAdapterRegistry();
    bare.register({ ...adapter, type: "bare" });
    expect(bare.getImportPermissions("bare")).toEqual([]);
    expect(bare.getExportPermissions("bare")).toEqual([]);
  });
});
