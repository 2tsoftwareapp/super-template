import type { JsonObject } from "@repo/api-kernel";

import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { PaginationQueryDto } from "@repo/api-runtime";
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateIf,
} from "class-validator";

export const NOTIFICATION_AUDIENCE_VALUES = ["USER", "USERS", "ALL"] as const;
export const NOTIFICATION_JOB_STATUS_VALUES = [
  "PENDING",
  "PROCESSING",
  "COMPLETED",
  "CANCELLED",
  "FAILED",
] as const;

export class NotificationDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  type: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  body: string;

  @ApiPropertyOptional({ type: "object", additionalProperties: true })
  data: JsonObject | null;

  @ApiPropertyOptional()
  readAt: string | null;

  @ApiProperty()
  createdAt: string;
}

export class NotificationsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  unread?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  type?: string;
}

export enum NotificationAudienceDto {
  USER = "USER",
  USERS = "USERS",
  ALL = "ALL",
}

export enum NotificationJobStatusDto {
  PENDING = "PENDING",
  PROCESSING = "PROCESSING",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
  FAILED = "FAILED",
}

export class SendNotificationRequestDto {
  @ApiProperty({ enum: NOTIFICATION_AUDIENCE_VALUES })
  @IsEnum(NotificationAudienceDto)
  audience: NotificationAudienceDto;

  @ApiPropertyOptional()
  @ValidateIf(
    (input: SendNotificationRequestDto) => input.audience === NotificationAudienceDto.USER,
  )
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({ type: [String] })
  @ValidateIf(
    (input: SendNotificationRequestDto) => input.audience === NotificationAudienceDto.USERS,
  )
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID("4", { each: true })
  userIds?: string[];

  @ApiProperty()
  @IsString()
  type: string;

  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsString()
  body: string;

  @ApiPropertyOptional({ type: "object", additionalProperties: true })
  @IsOptional()
  @IsObject()
  data?: JsonObject;

  @ApiPropertyOptional({
    description: "ISO-8601 datetime. Omit or set to now for immediate delivery.",
  })
  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @ApiPropertyOptional({
    description:
      "Client-supplied idempotency key. Retries with the same key return the original notification job.",
  })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  idempotencyKey?: string;
}

export class NotificationJobDto {
  @ApiProperty()
  id: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  actorId: string | null;

  @ApiProperty({ enum: NotificationAudienceDto })
  audience: NotificationAudienceDto;

  @ApiPropertyOptional({ type: String, nullable: true })
  targetUserId: string | null;

  @ApiPropertyOptional({ type: [String] })
  userIds: string[] | null;

  @ApiProperty()
  type: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  body: string;

  @ApiPropertyOptional({ type: "object", additionalProperties: true })
  data: JsonObject | null;

  @ApiProperty()
  scheduledAt: string;

  @ApiProperty({ enum: NOTIFICATION_JOB_STATUS_VALUES })
  status: NotificationJobStatusDto;

  @ApiPropertyOptional()
  recipientCount: number | null;

  @ApiPropertyOptional()
  processedAt: string | null;

  @ApiPropertyOptional()
  errorMessage: string | null;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;
}

export class NotificationJobsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: NotificationJobStatusDto })
  @IsOptional()
  @IsEnum(NotificationJobStatusDto)
  status?: NotificationJobStatusDto;
}

export enum NotificationDevicePlatformDto {
  IOS = "IOS",
  ANDROID = "ANDROID",
}

export class RegisterDeviceDto {
  @ApiProperty()
  @IsString()
  token: string;

  @ApiProperty({ enum: NotificationDevicePlatformDto })
  @IsEnum(NotificationDevicePlatformDto)
  platform: NotificationDevicePlatformDto;
}

export class DeviceTokenDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ enum: NotificationDevicePlatformDto })
  platform: NotificationDevicePlatformDto;

  @ApiProperty()
  token: string;

  @ApiProperty()
  lastUsedAt: string;
}
