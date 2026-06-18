import { Global, Module } from '@nestjs/common';

import { ImportExportAdapterRegistry } from '../../ports/import-export-adapter.port';

@Global()
@Module({
  providers: [ImportExportAdapterRegistry],
  exports: [ImportExportAdapterRegistry],
})
export class ImportExportModule {}
