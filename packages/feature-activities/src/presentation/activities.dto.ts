import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { type JsonObject, PaginationQueryDto } from "@repo/api-runtime";
import { IsOptional, IsString, IsUUID } from "class-validator";

export class ActivityDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  summary: string;

  @ApiProperty()
  entityType: string;

  @ApiProperty()
  entityId: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  actorId: string | null;

  @ApiProperty({ enum: ["PUBLIC", "PRIVATE", "INTERNAL"] })
  visibility: "PUBLIC" | "PRIVATE" | "INTERNAL";

  @ApiPropertyOptional({ type: "object", additionalProperties: true })
  metadata: JsonObject | null;

  @ApiProperty()
  createdAt: string;
}

export class ActivitiesQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  entityType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  entityId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  actorId?: string;
}
