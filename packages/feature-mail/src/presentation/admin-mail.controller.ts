import type { AuthenticatedRequestUser } from "@repo/api-runtime";

import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import {
  ACTION,
  ApiArrayResponse,
  ApiDataResponse,
  ApiPaginatedResponse,
  perm,
} from "@repo/api-runtime";
import { Authorize, CurrentUser } from "@repo/api-runtime";

import { ListMailDeliveriesUseCase } from "../application/use-cases/list-mail-deliveries.use-case";
import { ListMailTemplatesUseCase } from "../application/use-cases/list-mail-templates.use-case";
import { PreviewMailTemplateUseCase } from "../application/use-cases/preview-mail-template.use-case";
import { SendAdminMailUseCase } from "../application/use-cases/send-admin-mail.use-case";
import {
  MailDeliveriesQueryDto,
  MailDeliveryDto,
  MailPreviewDto,
  MailPreviewQueryDto,
  MailTemplateDto,
  SendAdminMailDto,
  SendAdminMailResultDto,
} from "./mail.dto";

@ApiTags("admin-mail")
@ApiBearerAuth()
@Controller("admin/mail")
export class AdminMailController {
  constructor(
    private readonly listMailTemplates: ListMailTemplatesUseCase,
    private readonly listMailDeliveries: ListMailDeliveriesUseCase,
    private readonly previewMailTemplate: PreviewMailTemplateUseCase,
    private readonly sendAdminMail: SendAdminMailUseCase,
  ) {}

  @Get("templates")
  @Authorize({ permissions: [perm("mail", ACTION.READ)] })
  @ApiArrayResponse(MailTemplateDto)
  async listTemplates() {
    return { data: await this.listMailTemplates.execute() };
  }

  @Get("deliveries")
  @Authorize({ permissions: [perm("mail", ACTION.READ)] })
  @ApiPaginatedResponse(MailDeliveryDto)
  async listDeliveries(@Query() query: MailDeliveriesQueryDto) {
    const result = await this.listMailDeliveries.execute(query);

    return {
      data: result.rows,
      meta: {
        page: query.page,
        limit: query.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / query.limit),
      },
    };
  }

  @Get("preview/:templateKey")
  @Authorize({ permissions: [perm("mail", ACTION.READ)] })
  @ApiDataResponse(MailPreviewDto)
  async preview(@Param("templateKey") templateKey: string, @Query() query: MailPreviewQueryDto) {
    return {
      data: await this.previewMailTemplate.execute(templateKey, query.variables),
    };
  }

  @Post("send")
  @Authorize({ permissions: [perm("mail", ACTION.CREATE)] })
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiDataResponse(SendAdminMailResultDto, 201)
  async send(@CurrentUser() user: AuthenticatedRequestUser, @Body() input: SendAdminMailDto) {
    return {
      data: await this.sendAdminMail.execute(user, {
        templateKey: input.templateKey,
        to: input.to,
        ...(input.variables !== undefined ? { variables: input.variables } : {}),
        ...(input.idempotencyKey !== undefined ? { idempotencyKey: input.idempotencyKey } : {}),
      }),
    };
  }
}
