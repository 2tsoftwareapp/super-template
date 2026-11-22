import { Body, Controller, HttpCode, Inject, Post, UseGuards } from "@nestjs/common";

import { Roles } from "../../shared/roles.decorator";
import { RolesGuard } from "../../shared/roles.guard";
import { validate } from "../../shared/validation";
import { SendMailDto } from "./mail.dto";
import { MailService } from "./mail.service";

@Controller("mail")
@UseGuards(RolesGuard)
@Roles("ADMIN")
export class MailController {
  constructor(@Inject(MailService) private readonly mail: MailService) {}

  @Post("send")
  @HttpCode(202)
  async send(@Body(validate(SendMailDto)) input: SendMailDto) {
    return { data: await this.mail.send(input) };
  }
}
