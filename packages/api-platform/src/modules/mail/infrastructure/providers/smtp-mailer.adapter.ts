import type { SendMailOptions } from "nodemailer";

import { Injectable } from "@nestjs/common";
import { EnvironmentService } from "@repo/api-core";
import { createTransport, type Transporter } from "nodemailer";

import type { Mailer, MailMessage } from "../../application/ports/mailer.interface";

@Injectable()
export class SmtpMailerService implements Mailer {
  private readonly transporter: Transporter;

  constructor(private readonly environmentService: EnvironmentService) {
    this.transporter = this.environmentService.isTest
      ? createTransport({ jsonTransport: true })
      : createTransport({
          host: this.environmentService.values.MAIL_HOST,
          port: this.environmentService.values.MAIL_PORT,
          secure: false,
        });
  }

  async send(message: MailMessage): Promise<void> {
    const payload: SendMailOptions = {
      from: this.environmentService.values.MAIL_FROM,
      ...message,
    };

    await this.transporter.sendMail(payload);
  }
}
