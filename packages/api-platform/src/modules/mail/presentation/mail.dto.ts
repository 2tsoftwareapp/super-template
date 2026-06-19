import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { type JsonObject, PaginationQueryDto } from '@repo/api-core';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class MailDeliveryDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  templateKey: string;

  @ApiProperty()
  recipient: string;

  @ApiProperty()
  subject: string;

  @ApiProperty({ enum: ['SENT', 'FAILED'] })
  status: 'SENT' | 'FAILED';

  @ApiPropertyOptional()
  errorMessage: string | null;

  @ApiPropertyOptional({ type: 'object', additionalProperties: true })
  metadata: JsonObject | null;

  @ApiPropertyOptional()
  sentAt: string | null;

  @ApiProperty()
  createdAt: string;
}

export class MailDeliveriesQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  templateKey?: string;

  @ApiPropertyOptional({ enum: ['SENT', 'FAILED'] })
  @IsOptional()
  @IsEnum(['SENT', 'FAILED'])
  status?: 'SENT' | 'FAILED';
}

export class MailPreviewDto {
  @ApiProperty()
  subject: string;

  @ApiProperty()
  text: string;

  @ApiProperty()
  html: string;
}
