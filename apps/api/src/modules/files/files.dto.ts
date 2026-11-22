import { Transform } from "class-transformer";
import { IsInt, IsOptional, Max, Min } from "class-validator";

import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from "../../shared/pagination";

export class ListFilesQueryDto {
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  @Max(MAX_PAGE_SIZE)
  limit: number = DEFAULT_PAGE_SIZE;
}

export interface FileDto {
  id: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  uploaderId: string;
  createdAt: string;
  downloadUrl: string;
}
