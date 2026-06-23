import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { type JsonObject, PaginationQueryDto } from '@repo/api-core';
import { IsDateString, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';

export class JobDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  type: string;

  @ApiProperty({ type: 'object', additionalProperties: true })
  payload: JsonObject;

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

export class JobEventDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  jobId: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  attemptId: string | null;

  @ApiProperty({
    enum: [
      'claimed',
      'completed',
      'failed',
      'retry_scheduled',
      'cancelled',
      'no_handler',
    ],
  })
  type: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  message: string | null;

  @ApiPropertyOptional({ type: 'object', additionalProperties: true, nullable: true })
  metadata: JsonObject | null;

  @ApiProperty()
  createdAt: string;
}

export class JobLogsQueryDto extends PaginationQueryDto {}

export class JobDependencyDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  dependsOnJobId: string;

  @ApiProperty({
    enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'CANCELLED', 'FAILED'],
  })
  dependsOnJobStatus: string;

  @ApiProperty()
  createdAt: string;
}

export class AddJobDependencyDto {
  @ApiProperty()
  @IsUUID()
  dependsOnJobId: string;
}

export class JobMetricsQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  to?: string;
}

export class JobStatusCountDto {
  @ApiProperty()
  status: string;

  @ApiProperty()
  total: number;
}

export class JobTypeCountDto {
  @ApiProperty()
  type: string;

  @ApiProperty()
  total: number;
}

export class JobMetricsDto {
  @ApiProperty({ type: [JobStatusCountDto] })
  byStatus: JobStatusCountDto[];

  @ApiProperty({ type: [JobTypeCountDto] })
  byType: JobTypeCountDto[];

  @ApiPropertyOptional({ type: Number, nullable: true })
  averageDurationMs: number | null;

  @ApiProperty()
  retryRate: number;

  @ApiProperty()
  failureRate: number;

  @ApiProperty()
  totalCompleted: number;

  @ApiProperty()
  totalFailed: number;
}
