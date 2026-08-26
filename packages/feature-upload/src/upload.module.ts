import { Module } from "@nestjs/common";

import { AttachmentsModule } from "./attachments/attachments.module";
import { FilesModule } from "./files/files.module";
import { StorageModule } from "./storage/storage.module";

@Module({
  imports: [StorageModule, FilesModule, AttachmentsModule],
  exports: [StorageModule, FilesModule, AttachmentsModule],
})
export class UploadModule {}
