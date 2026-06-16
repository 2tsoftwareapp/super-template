import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { PaginationQueryDto } from '@repo/api-core/common/pagination/pagination.dto';

export class ActivityDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  summary: string;

  @ApiProperty()
  entityType: string;

  @ApiProperty()
  entityId: string;

  @ApiPropertyOptional()
  actorId: string | null;

  @ApiProperty({ enum: ['PUBLIC', 'PRIVATE', 'INTERNAL'] })
  visibility: 'PUBLIC' | 'PRIVATE' | 'INTERNAL';

  @ApiPropertyOptional({ type: 'object', additionalProperties: true })
  metadata: Record<string, unknown> | null;

  @ApiProperty()
  createdAt: string;
}

export class ActivitiesQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  entityType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  entityId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  actorId?: string;
}
