import {
  Body,
  Controller,
  HttpCode,
  Inject,
  Post,
  UseGuards,
  ValidationPipe,
} from "@nestjs/common";

import { Roles } from "../../shared/roles.decorator";
import { RolesGuard } from "../../shared/roles.guard";
import { SendMailDto } from "./mail.dto";
import { MailService } from "./mail.service";

@Controller("mail")
@UseGuards(RolesGuard)
@Roles("ADMIN")
export class MailController {
  constructor(@Inject(MailService) private readonly mail: MailService) {}

  @Post("send")
  @HttpCode(202)
  async send(@Body(new ValidationPipe({ expectedType: SendMailDto })) input: SendMailDto) {
    return { data: await this.mail.send(input) };
  }
}
