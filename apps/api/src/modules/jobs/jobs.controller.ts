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
} from "@nestjs/common";

import { Roles } from "../../shared/roles.decorator";
import { RolesGuard } from "../../shared/roles.guard";
import { validate } from "../../shared/validation";
import { EnqueueJobDto, ListJobsQueryDto, type JobDto } from "./jobs.dto";
import { JobsService } from "./jobs.service";

@Controller("jobs")
@UseGuards(RolesGuard)
@Roles("ADMIN")
export class JobsController {
  constructor(@Inject(JobsService) private readonly jobs: JobsService) {}

  @Get()
  list(
    @Query(validate(ListJobsQueryDto))
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
  async enqueue(@Body(validate(EnqueueJobDto)) input: EnqueueJobDto): Promise<{ data: JobDto }> {
    return { data: await this.jobs.enqueue(input) };
  }
}
