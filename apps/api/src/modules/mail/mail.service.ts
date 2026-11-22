import { Inject, Injectable } from "@nestjs/common";

import { JobsService } from "../jobs/jobs.service";
import type { SendMailDto } from "./mail.dto";

@Injectable()
export class MailService {
  constructor(@Inject(JobsService) private readonly jobs: JobsService) {}

  /** Mail is sent by the worker, never inside the request: SMTP can be slow or down. */
  async send(input: SendMailDto): Promise<{ jobId: string; status: string }> {
    const job = await this.jobs.enqueue({
      type: "mail.send",
      payload: { to: input.to, subject: input.subject, text: input.text },
    });

    return { jobId: job.id, status: job.status };
  }
}
