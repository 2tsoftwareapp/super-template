import { Module } from "@nestjs/common";

import { RolesGuard } from "../../shared/roles.guard";
import { JobsController } from "./jobs.controller";
import { JobsRepository } from "./jobs.repository";
import { JobsService } from "./jobs.service";

@Module({
  controllers: [JobsController],
  providers: [JobsRepository, JobsService, RolesGuard],
  exports: [JobsService],
})
export class JobsModule {}
