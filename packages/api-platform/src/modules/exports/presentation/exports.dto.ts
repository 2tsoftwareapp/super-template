import type { JsonObject } from '@repo/api-core';

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsObject, IsOptional, IsString, MaxLength } from 'class-validator';

export class ExportJobDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  type: string;

  @ApiProperty({
    enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED'],
  })
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

  @ApiPropertyOptional()
  fileId: string | null;

  @ApiPropertyOptional({ type: 'object', additionalProperties: true })
  filters: JsonObject | null;

  @ApiProperty()
  createdById: string;

  @ApiPropertyOptional()
  completedAt: string | null;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;
}

export class CreateExportDto {
  @ApiProperty()
  @IsString()
  type: string;

  @ApiPropertyOptional({ type: 'object', additionalProperties: true })
  @IsOptional()
  @IsObject()
  filters?: JsonObject;

  @ApiPropertyOptional({
    description:
      'Client-supplied idempotency key. Retries with the same key return the original export job.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  idempotencyKey?: string;
}
