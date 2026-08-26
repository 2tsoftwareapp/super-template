import { ApiPropertyOptional } from "@nestjs/swagger";
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from "@repo/config";
import { Transform, Type } from "class-transformer";
import { IsIn, IsInt, IsOptional, Max, Min } from "class-validator";

export class PaginationQueryDto {
  @ApiPropertyOptional({ type: Number, default: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page = 1;

  @ApiPropertyOptional({
    type: Number,
    default: DEFAULT_PAGE_SIZE,
    maximum: MAX_PAGE_SIZE,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_PAGE_SIZE)
  @IsOptional()
  limit = DEFAULT_PAGE_SIZE;

  @ApiPropertyOptional({ default: "desc", enum: ["asc", "desc"] })
  @Transform(({ value }): string =>
    typeof value === "string" ? value.toLowerCase() : String(value),
  )
  @IsIn(["asc", "desc"])
  @IsOptional()
  sortOrder: "asc" | "desc" = "desc";
}
