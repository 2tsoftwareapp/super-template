import { Global, Module } from "@nestjs/common";
import { ImportExportAdapterRegistry } from "../public/contracts";

@Global()
@Module({
  providers: [ImportExportAdapterRegistry],
  exports: [ImportExportAdapterRegistry],
})
export class ImportExportModule {}
