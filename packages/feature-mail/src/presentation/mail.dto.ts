import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { type JsonObject, type JsonValue, PaginationQueryDto } from "@repo/api-runtime";
import { Transform } from "class-transformer";
import { IsEmail, IsEnum, IsObject, IsOptional, IsString, MaxLength } from "class-validator";

export class MailDeliveryDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  templateKey: string;

  @ApiProperty()
  recipient: string;

  @ApiProperty()
  subject: string;

  @ApiProperty({ enum: ["SENT", "FAILED"] })
  status: "SENT" | "FAILED";

  @ApiPropertyOptional()
  errorMessage: string | null;

  @ApiPropertyOptional({ type: "object", additionalProperties: true })
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

  @ApiPropertyOptional({ enum: ["SENT", "FAILED"] })
  @IsOptional()
  @IsEnum(["SENT", "FAILED"])
  status?: "SENT" | "FAILED";
}

export class MailTemplateDto {
  @ApiProperty()
  key: string;

  @ApiProperty()
  mandatory: boolean;

  @ApiProperty({
    description: "Whether this template can be sent ad hoc via POST /admin/mail/send.",
  })
  sendable: boolean;

  @ApiProperty({ type: [String] })
  variables: string[];
}

export class MailPreviewDto {
  @ApiProperty()
  subject: string;

  @ApiProperty()
  text: string;

  @ApiProperty()
  html: string;

  @ApiProperty({
    type: [String],
    description: "Template variables with no supplied or default value.",
  })
  missingVariables: string[];
}

export class MailPreviewQueryDto {
  @ApiPropertyOptional({
    type: "string",
    description: 'Template variables encoded as a JSON object string, e.g. {"displayName":"Jane"}.',
  })
  @IsOptional()
  @Transform(({ value }): JsonValue => {
    if (typeof value !== "string") {
      return value as JsonValue;
    }

    try {
      return JSON.parse(value) as JsonValue;
    } catch {
      return value;
    }
  })
  @IsObject()
  variables?: Record<string, string>;
}

export class SendAdminMailDto {
  @ApiProperty({
    description: "Non-mandatory template key (security templates cannot be sent ad hoc).",
  })
  @IsString()
  @MaxLength(120)
  templateKey: string;

  @ApiProperty()
  @IsEmail()
  to: string;

  @ApiPropertyOptional({ type: "object", additionalProperties: { type: "string" } })
  @IsOptional()
  @IsObject()
  variables?: Record<string, string>;

  @ApiPropertyOptional({
    description: "Replaying the same key returns the original job instead of sending again.",
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  idempotencyKey?: string;
}

export class SendAdminMailResultDto {
  @ApiProperty()
  jobId: string;

  @ApiProperty({
    enum: ["PENDING", "PROCESSING", "COMPLETED", "CANCELLED", "FAILED"],
  })
  status: string;
}
