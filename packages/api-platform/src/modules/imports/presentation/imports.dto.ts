import type { ImportValidationError } from '@repo/api-core';

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

import { SUPPORTED_IMPORT_TYPES } from '../domain/import-types';

export class ImportJobDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  type: string;

  @ApiProperty()
  fileId: string;

  @ApiProperty({
    enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED'],
  })
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

  @ApiPropertyOptional()
  rowCount: number | null;

  @ApiPropertyOptional()
  successCount: number | null;

  @ApiPropertyOptional()
  errorCount: number | null;

  @ApiPropertyOptional({ type: 'array', items: { type: 'object' } })
  errors: ImportValidationError[] | null;

  @ApiProperty()
  createdById: string;

  @ApiPropertyOptional()
  confirmedAt: string | null;

  @ApiPropertyOptional()
  completedAt: string | null;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;
}

export class CreateImportDto {
  @ApiProperty({ enum: SUPPORTED_IMPORT_TYPES })
  @IsIn([...SUPPORTED_IMPORT_TYPES])
  type: string;

  @ApiProperty()
  @IsUUID()
  fileId: string;

  @ApiPropertyOptional({
    description:
      'Client-supplied idempotency key. Retries with the same key return the original import job.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  idempotencyKey?: string;
}
