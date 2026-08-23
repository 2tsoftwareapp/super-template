import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { type JsonObject, PaginationQueryDto } from "@repo/api-core";
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from "class-validator";

export class FileDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  originalName: string;

  @ApiProperty()
  mimeType: string;

  @ApiProperty()
  sizeBytes: number;

  @ApiPropertyOptional({ type: String, nullable: true })
  checksum: string | null;

  @ApiProperty()
  latestVersion: number;

  @ApiProperty({ type: String, nullable: true })
  uploadedById: string | null;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;
}

export class FileUrlDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  url: string;

  @ApiProperty()
  expiresInSeconds: number;
}

export class FilesQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: "Match against the original file name." })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  search?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  mimeType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  uploadedById?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  to?: string;

  @ApiPropertyOptional({
    enum: ["createdAt", "originalName", "sizeBytes"],
    default: "createdAt",
  })
  @IsOptional()
  @IsEnum(["createdAt", "originalName", "sizeBytes"])
  sortField: "createdAt" | "originalName" | "sizeBytes" = "createdAt";
}

export class FileVersionDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  fileId: string;

  @ApiProperty()
  versionNumber: number;

  @ApiProperty()
  mimeType: string;

  @ApiProperty()
  sizeBytes: number;

  @ApiProperty()
  checksum: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  createdById: string | null;

  @ApiProperty()
  createdAt: string;
}

export class FileHistoryEventDto {
  @ApiProperty({ enum: ["version", "audit"] })
  type: "version" | "audit";

  @ApiProperty()
  action: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  actorId: string | null;

  @ApiPropertyOptional({ type: "object", additionalProperties: true })
  metadata: JsonObject | null;

  @ApiProperty()
  createdAt: string;
}

export class BatchDeleteFilesDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @IsUUID("all", { each: true })
  fileIds: string[];

  @ApiPropertyOptional({
    description:
      "Replaying the same key returns the original result instead of re-running the batch.",
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  idempotencyKey?: string;
}

export class BatchDeleteResultItemDto {
  @ApiProperty()
  fileId: string;

  @ApiProperty()
  success: boolean;

  @ApiPropertyOptional({ type: String, nullable: true })
  error: string | null;
}

export class BatchDeleteResultDto {
  @ApiProperty({ type: [BatchDeleteResultItemDto] })
  results: BatchDeleteResultItemDto[];
}
