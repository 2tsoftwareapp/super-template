import type { JsonObject } from "@repo/api-runtime";

import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsObject, IsOptional, IsString, MaxLength } from "class-validator";

import {
  PREFERENCE_LANGUAGES,
  PREFERENCE_THEMES,
  type PreferenceLanguage,
  type PreferenceTheme,
} from "../application/preferences.constants";

export class UserPreferencesDto {
  @ApiProperty()
  userId: string;

  @ApiProperty({ enum: PREFERENCE_THEMES })
  theme: string;

  @ApiProperty({ enum: PREFERENCE_LANGUAGES })
  language: string;

  @ApiProperty()
  timezone: string;

  @ApiProperty({ type: "object", additionalProperties: true })
  notificationPreferences: JsonObject;

  @ApiProperty({ type: "object", additionalProperties: true })
  emailPreferences: JsonObject;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;
}

export class UpdatePreferencesDto {
  @ApiPropertyOptional({ enum: PREFERENCE_THEMES })
  @IsOptional()
  @IsEnum(PREFERENCE_THEMES)
  theme?: PreferenceTheme;

  @ApiPropertyOptional({ enum: PREFERENCE_LANGUAGES })
  @IsOptional()
  @IsEnum(PREFERENCE_LANGUAGES)
  language?: PreferenceLanguage;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(64)
  timezone?: string;

  @ApiPropertyOptional({ type: "object", additionalProperties: true })
  @IsOptional()
  @IsObject()
  notificationPreferences?: JsonObject;

  @ApiPropertyOptional({ type: "object", additionalProperties: true })
  @IsOptional()
  @IsObject()
  emailPreferences?: JsonObject;
}
