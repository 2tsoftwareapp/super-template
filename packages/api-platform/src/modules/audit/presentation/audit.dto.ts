import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { type JsonObject, PaginationQueryDto } from '@repo/api-core';
import { IsDateString, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class AuditLogDto {
  @ApiProperty()
  id: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  actorId: string | null;

  @ApiProperty()
  action: string;

  @ApiProperty()
  entityType: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  entityId: string | null;

  @ApiPropertyOptional({ type: 'object', additionalProperties: true })
  metadata: JsonObject | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  ipAddress: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  userAgent: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  requestId: string | null;

  @ApiProperty()
  createdAt: string;
}

export class AuditLogsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  actorId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  action?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  resourceType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  resourceId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  to?: string;

  @ApiPropertyOptional({
    description: 'Free-text match against action, entity type, and request ID.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  q?: string;
}

export class ExportAuditLogsQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  actorId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  action?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  resourceType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  resourceId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  to?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  q?: string;
}

export class AuditExportResultDto {
  @ApiProperty()
  fileId: string;

  @ApiProperty()
  rowCount: number;
}
