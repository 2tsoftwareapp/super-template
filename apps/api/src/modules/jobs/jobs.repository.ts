import { Inject, Injectable } from "@nestjs/common";
import { enqueueJob, findJob, listJobs, type EnqueueJobInput, type JobStatus } from "@lean/db";

import { DatabaseService } from "../../shared/database.service";

@Injectable()
export class JobsRepository {
  constructor(@Inject(DatabaseService) private readonly database: DatabaseService) {}

  enqueue(input: EnqueueJobInput) {
    return enqueueJob(this.database.db, input);
  }

  list(input: { page: number; limit: number; status?: JobStatus }) {
    return listJobs(this.database.db, input);
  }

  findById(jobId: string) {
    return findJob(this.database.db, jobId);
  }
}
