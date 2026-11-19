import {
  Body,
  Controller,
  Get,
  HttpCode,
  Inject,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
  ValidationPipe,
} from "@nestjs/common";

import { Roles } from "../../shared/roles.decorator";
import { RolesGuard } from "../../shared/roles.guard";
import { EnqueueJobDto, ListJobsQueryDto, type JobDto } from "./jobs.dto";
import { JobsService } from "./jobs.service";

@Controller("jobs")
@UseGuards(RolesGuard)
@Roles("ADMIN")
export class JobsController {
  constructor(@Inject(JobsService) private readonly jobs: JobsService) {}

  @Get()
  list(
    @Query(new ValidationPipe({ expectedType: ListJobsQueryDto, transform: true }))
    query: ListJobsQueryDto,
  ) {
    return this.jobs.list(query);
  }

  @Get(":id")
  async get(@Param("id", ParseUUIDPipe) jobId: string): Promise<{ data: JobDto }> {
    return { data: await this.jobs.get(jobId) };
  }

  @Post()
  @HttpCode(201)
  async enqueue(
    @Body(new ValidationPipe({ expectedType: EnqueueJobDto })) input: EnqueueJobDto,
  ): Promise<{ data: JobDto }> {
    return { data: await this.jobs.enqueue(input) };
  }
}
