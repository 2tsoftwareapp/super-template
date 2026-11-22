import { Module } from "@nestjs/common";

import { JobsModule } from "../jobs/jobs.module";
import { MailController } from "./mail.controller";
import { MailService } from "./mail.service";

@Module({
  imports: [JobsModule],
  controllers: [MailController],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
