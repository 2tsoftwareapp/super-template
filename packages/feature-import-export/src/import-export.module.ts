import { Module } from "@nestjs/common";

import { ExportsModule } from "./exports/exports.module";
import { ImportExportModule } from "./import-export/import-export.module";
import { ImportsModule } from "./imports/imports.module";

@Module({
  imports: [ImportExportModule, ImportsModule, ExportsModule],
  exports: [ImportExportModule, ImportsModule, ExportsModule],
})
export class ImportExportFeatureModule {}
