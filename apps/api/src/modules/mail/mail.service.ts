import { Inject, Injectable } from "@nestjs/common";

import { JobsRepository } from "../jobs/jobs.repository";
import type { SendMailDto } from "./mail.dto";

@Injectable()
export class MailService {
  constructor(@Inject(JobsRepository) private readonly jobs: JobsRepository) {}

  /** Mail is sent by the worker, never inside the request: SMTP can be slow or down. */
  async send(input: SendMailDto) {
    const job = await this.jobs.enqueue({
      type: "mail.send",
      payload: { to: input.to, subject: input.subject, text: input.text },
    });

    return { jobId: job.id, status: job.status };
  }
}
