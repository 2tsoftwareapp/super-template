import { Module } from "@nestjs/common";

import { ImportExportModule } from "./import-export/import-export.module";
import { ExportsModule } from "./modules/exports/exports.module";
import { ImportsModule } from "./modules/imports/imports.module";
import { StorageModule } from "./modules/storage";
import { PlatformPortsModule } from "./platform-ports.module";

@Module({
  // PlatformPortsModule (@Global) is the single owner of the eight globally
  // exported feature modules. PlatformModule adds the intentionally non-global
  // modules (storage, imports, exports) plus the global import/export adapter
  // registry so the whole context composes from a single module.
  imports: [ImportExportModule, PlatformPortsModule, StorageModule, ImportsModule, ExportsModule],
  exports: [ImportExportModule, PlatformPortsModule, StorageModule, ImportsModule, ExportsModule],
})
export class PlatformModule {}
