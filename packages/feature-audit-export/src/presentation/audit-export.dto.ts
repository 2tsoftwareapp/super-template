import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsDateString, IsOptional, IsString, MaxLength } from "class-validator";

export class ExportAuditLogsQueryDto {
  @ApiProperty({ required: false, format: "uuid" })
  @IsOptional()
  @IsString()
  @Type(() => String)
  actorId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  @Type(() => String)
  action?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  @Type(() => String)
  resourceType?: string;

  @ApiProperty({ required: false, format: "uuid" })
  @IsOptional()
  @IsString()
  @Type(() => String)
  resourceId?: string;

  @ApiProperty({ required: false, format: "date-time" })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiProperty({ required: false, format: "date-time" })
  @IsOptional()
  @IsDateString()
  to?: string;

  @ApiProperty({
    required: false,
    description: "Free-text match against action, entity type, and request ID.",
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  q?: string;
}

export class AuditExportResultDto {
  @ApiProperty({ format: "uuid" })
  fileId!: string;

  @ApiProperty()
  rowCount!: number;

  @ApiProperty()
  totalMatching!: number;

  @ApiProperty()
  truncated!: boolean;
}
