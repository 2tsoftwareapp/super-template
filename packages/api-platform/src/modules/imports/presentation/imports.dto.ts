import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

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
  errors: Record<string, unknown>[] | null;

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
  @ApiProperty()
  @IsString()
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
