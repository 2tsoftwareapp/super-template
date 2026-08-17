import { BadRequestException } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";

import {
  getUploadExtension,
  isAllowedUploadExtension,
  MAX_FILE_SIZE_BYTES,
} from "../application/upload-limits";

export const UploadFileInterceptor = FileInterceptor("file", {
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES,
  },
  fileFilter: (_request, file, callback) => {
    const extension = getUploadExtension(file.originalname);

    if (!isAllowedUploadExtension(extension)) {
      callback(new BadRequestException("Unsupported file extension"), false);
      return;
    }

    callback(null, true);
  },
});
