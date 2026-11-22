import { Module } from "@nestjs/common";
import { MulterModule } from "@nestjs/platform-express";
import { loadEnv } from "@lean/config";

import { FilesController } from "./files.controller";
import { FilesRepository } from "./files.repository";
import { FilesService } from "./files.service";

@Module({
  imports: [
    // Multer stops reading at the limit, so an oversized upload never fills memory.
    MulterModule.registerAsync({
      useFactory: () => ({ limits: { fileSize: loadEnv().MAX_UPLOAD_BYTES, files: 1 } }),
    }),
  ],
  controllers: [FilesController],
  providers: [FilesRepository, FilesService],
})
export class FilesModule {}
