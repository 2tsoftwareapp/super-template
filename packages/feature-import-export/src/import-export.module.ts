import { Module } from "@nestjs/common";

import { ExportsModule } from "./exports/exports.module";
import { ImportsModule } from "./imports/imports.module";
import { ImportExportModule } from "./infrastructure/import-export.module";

@Module({
  imports: [ImportExportModule, ImportsModule, ExportsModule],
  exports: [ImportExportModule, ImportsModule, ExportsModule],
})
export class ImportExportFeatureModule {}

export { ImportExportModule } from "./infrastructure/import-export.module";
