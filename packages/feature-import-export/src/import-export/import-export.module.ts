import { Global, Module } from "@nestjs/common";
import { ImportExportAdapterRegistry } from "@repo/api-runtime";

@Global()
@Module({
  providers: [ImportExportAdapterRegistry],
  exports: [ImportExportAdapterRegistry],
})
export class ImportExportModule {}
