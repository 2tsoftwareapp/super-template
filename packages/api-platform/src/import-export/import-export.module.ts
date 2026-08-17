import { Global, Module } from '@nestjs/common';

import { ImportExportAdapterRegistry } from './import-export-adapter.registry';

@Global()
@Module({
  providers: [ImportExportAdapterRegistry],
  exports: [ImportExportAdapterRegistry],
})
export class ImportExportModule {}