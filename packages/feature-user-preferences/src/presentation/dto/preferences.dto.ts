import type { JsonObject } from "@repo/api-kernel";

import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsObject, IsOptional } from "class-validator";

import type { PreferenceLanguage, PreferenceTheme } from "../../application/preferences.constants";

import { PREFERENCE_LANGUAGES, PREFERENCE_THEMES } from "../../application/preferences.constants";
import {
  IsPreferenceLanguage,
  IsPreferenceTheme,
  IsPreferenceTimezone,
} from "../preferences.validators";

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
  @IsPreferenceTheme()
  theme?: PreferenceTheme;

  @ApiPropertyOptional({ enum: PREFERENCE_LANGUAGES })
  @IsOptional()
  @IsPreferenceLanguage()
  language?: PreferenceLanguage;

  // Rule lives in application/preferences.validation.ts (single source of
  // truth); the custom validator here only surfaces it as an HTTP parse error.
  @ApiPropertyOptional({ maxLength: 64 })
  @IsOptional()
  @IsPreferenceTimezone()
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
