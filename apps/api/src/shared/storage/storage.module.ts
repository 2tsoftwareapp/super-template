import { Global, Module } from "@nestjs/common";

import { LocalStorageService } from "./local-storage.service";
import { STORAGE } from "./storage.port";

@Global()
@Module({
  providers: [LocalStorageService, { provide: STORAGE, useExisting: LocalStorageService }],
  exports: [STORAGE],
})
export class StorageModule {}
