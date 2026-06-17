import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '@repo/api-core';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class JobDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  type: string;

  @ApiProperty({ type: 'object', additionalProperties: true })
  payload: Record<string, unknown>;

  @ApiProperty({
    enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'CANCELLED', 'FAILED'],
  })
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED' | 'FAILED';

  @ApiProperty()
  scheduledAt: string;

  @ApiProperty()
  priority: number;

  @ApiProperty()
  attempts: number;

  @ApiProperty()
  maxAttempts: number;

  @ApiPropertyOptional()
  startedAt: string | null;

  @ApiPropertyOptional()
  completedAt: string | null;

  @ApiPropertyOptional()
  cancelledAt: string | null;

  @ApiPropertyOptional()
  errorMessage: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  createdById: string | null;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;
}

export class JobsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'CANCELLED', 'FAILED'],
  })
  @IsOptional()
  @IsEnum(['PENDING', 'PROCESSING', 'COMPLETED', 'CANCELLED', 'FAILED'])
  status?: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED' | 'FAILED';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  type?: string;
}
