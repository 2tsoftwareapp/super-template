import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class AttachmentDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  fileId: string;

  @ApiProperty()
  entityType: string;

  @ApiProperty()
  entityId: string;

  @ApiPropertyOptional({ nullable: true })
  label: string | null;

  @ApiPropertyOptional({ nullable: true })
  createdById: string | null;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;
}

export class AttachEntityDto {
  @ApiProperty()
  @IsUUID('4')
  fileId: string;

  @ApiProperty()
  @IsString()
  @MaxLength(64)
  entityType: string;

  @ApiProperty()
  @IsUUID('4')
  entityId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  label?: string;
}

export class AttachmentsQueryDto {
  @ApiProperty()
  @IsString()
  @MaxLength(64)
  entityType: string;

  @ApiProperty()
  @IsUUID('4')
  entityId: string;
}
