import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsObject } from 'class-validator';

export class ApplicationSettingDto {
  @ApiProperty()
  key: string;

  @ApiProperty({ type: 'object', additionalProperties: true })
  value: Record<string, unknown>;

  @ApiPropertyOptional()
  updatedById: string | null;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;
}

export class UpdateSettingDto {
  @ApiProperty({ type: 'object', additionalProperties: true })
  @IsObject()
  value: Record<string, unknown>;
}
