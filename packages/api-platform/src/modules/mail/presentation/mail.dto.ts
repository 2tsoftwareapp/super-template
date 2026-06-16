import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '@repo/api-core/common/pagination/pagination.dto';

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
  metadata: Record<string, unknown> | null;

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
