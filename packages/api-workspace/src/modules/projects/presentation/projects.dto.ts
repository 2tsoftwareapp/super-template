import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { PaginationQueryDto } from '@repo/api-core';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class ProjectDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  description: string | null;

  @ApiProperty({ enum: ['DRAFT', 'ACTIVE', 'ARCHIVED'] })
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';

  @ApiProperty()
  ownerId: string;

  @ApiProperty()
  createdById: string;

  @ApiPropertyOptional()
  updatedById: string | null;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;

  @ApiPropertyOptional()
  deletedAt: string | null;
}

export class ProjectAttachmentDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  fileId: string;

  @ApiProperty()
  entityType: string;

  @ApiProperty()
  entityId: string;

  @ApiPropertyOptional()
  label: string | null;

  @ApiPropertyOptional()
  createdById: string | null;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;
}

export class CreateProjectDto {
  @ApiProperty()
  @IsString()
  @MaxLength(160)
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  description?: string;

  @ApiPropertyOptional({ enum: ['DRAFT', 'ACTIVE', 'ARCHIVED'] })
  @IsOptional()
  @IsEnum(['DRAFT', 'ACTIVE', 'ARCHIVED'])
  status?: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  ownerId?: string;
}

export class UpdateProjectDto extends PartialType(CreateProjectDto) {}

export class ProjectsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: ['DRAFT', 'ACTIVE', 'ARCHIVED'] })
  @IsOptional()
  @IsEnum(['DRAFT', 'ACTIVE', 'ARCHIVED'])
  status?: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';

  @ApiPropertyOptional({
    enum: ['createdAt', 'name', 'status', 'updatedAt'],
    default: 'updatedAt',
  })
  @IsOptional()
  @IsEnum(['createdAt', 'name', 'status', 'updatedAt'])
  sortField: 'createdAt' | 'name' | 'status' | 'updatedAt' = 'updatedAt';
}
