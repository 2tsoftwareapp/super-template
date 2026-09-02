import { Global, Module } from "@nestjs/common";

import { ExportsModule } from "./exports/exports.module";
import { ImportExportAdapterRegistry } from "./infrastructure/import-export-adapter.registry";
import { ImportsModule } from "./imports/imports.module";

@Global()
@Module({
  providers: [ImportExportAdapterRegistry],
  exports: [ImportExportAdapterRegistry],
})
export class ImportExportModule {}

@Module({
  imports: [ImportExportModule, ImportsModule, ExportsModule],
  exports: [ImportExportModule, ImportsModule, ExportsModule],
})
export class ImportExportFeatureModule {}
