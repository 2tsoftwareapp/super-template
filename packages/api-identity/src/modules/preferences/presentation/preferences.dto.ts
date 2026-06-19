import type { JsonObject } from '@repo/api-core';

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsObject, IsOptional, IsString, MaxLength } from 'class-validator';

export class UserPreferencesDto {
  @ApiProperty()
  userId: string;

  @ApiProperty()
  theme: string;

  @ApiProperty()
  language: string;

  @ApiProperty()
  timezone: string;

  @ApiProperty({ type: 'object', additionalProperties: true })
  notificationPreferences: JsonObject;

  @ApiProperty({ type: 'object', additionalProperties: true })
  emailPreferences: JsonObject;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;
}

export class UpdatePreferencesDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(32)
  theme?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(16)
  language?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(64)
  timezone?: string;

  @ApiPropertyOptional({ type: 'object', additionalProperties: true })
  @IsOptional()
  @IsObject()
  notificationPreferences?: JsonObject;

  @ApiPropertyOptional({ type: 'object', additionalProperties: true })
  @IsOptional()
  @IsObject()
  emailPreferences?: JsonObject;
}
