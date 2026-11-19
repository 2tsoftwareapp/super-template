import { IsIn, IsInt, IsObject, IsOptional, IsString, Max, Min } from "class-validator";
import { Transform } from "class-transformer";

import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from "../../shared/pagination";

export const JOB_TYPES = ["demo.echo", "demo.fail", "mail.send"] as const;
export const JOB_STATUSES = ["PENDING", "PROCESSING", "DONE", "FAILED"] as const;

export class EnqueueJobDto {
  @IsString()
  @IsIn(JOB_TYPES)
  type!: (typeof JOB_TYPES)[number];

  @IsOptional()
  @IsObject()
  payload?: Record<string, unknown>;
}

export class ListJobsQueryDto {
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  @Max(MAX_PAGE_SIZE)
  limit: number = DEFAULT_PAGE_SIZE;

  @IsOptional()
  @IsIn(JOB_STATUSES)
  status?: (typeof JOB_STATUSES)[number];
}

export interface JobDto {
  id: string;
  type: string;
  status: string;
  attempts: number;
  maxAttempts: number;
  lastError: string | null;
  result: unknown;
  runAt: string;
  createdAt: string;
}
