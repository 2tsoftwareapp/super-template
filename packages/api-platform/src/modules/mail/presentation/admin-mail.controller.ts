import type { AuthenticatedRequestUser } from '@repo/api-core';

import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import {  ACTION, ApiArrayResponse, ApiDataResponse, ApiPaginatedResponse, perm } from '@repo/api-core';
import { Authorize, CurrentUser } from '@repo/api-core';

import { MailService } from '../application/mail.service';
import {
  MailDeliveriesQueryDto,
  MailDeliveryDto,
  MailPreviewDto,
  MailPreviewQueryDto,
  MailTemplateDto,
  SendAdminMailDto,
  SendAdminMailResultDto } from './mail.dto';

@ApiTags('admin-mail')
@ApiBearerAuth()
@Controller('admin/mail')
export class AdminMailController {
  constructor(private readonly mailService: MailService) {}

  @Get('templates')
  @Authorize({ permissions: [perm('mail', ACTION.READ)] })
  @ApiArrayResponse(MailTemplateDto)
  async listTemplates() {
    return { data: await this.mailService.listTemplates() };
  }

  @Get('deliveries')
  @Authorize({ permissions: [perm('mail', ACTION.READ)] })
  @ApiPaginatedResponse(MailDeliveryDto)
  async listDeliveries(@Query() query: MailDeliveriesQueryDto) {
    const result = await this.mailService.listDeliveries(query);

    return {
      data: result.rows,
      meta: {
        page: query.page,
        limit: query.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / query.limit) } };
  }

  @Get('preview/:templateKey')
  @Authorize({ permissions: [perm('mail', ACTION.READ)] })
  @ApiDataResponse(MailPreviewDto)
  preview(
    @Param('templateKey') templateKey: string,
    @Query() query: MailPreviewQueryDto,
  ) {
    return this.mailService.previewTemplate(templateKey, query.variables);
  }

  @Post('send')
  @Authorize({ permissions: [perm('mail', ACTION.CREATE)] })
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiDataResponse(SendAdminMailResultDto, 201)
  send(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Body() input: SendAdminMailDto,
  ) {
    return this.mailService.sendAdminMail(user, {
      templateKey: input.templateKey,
      to: input.to,
      ...(input.variables !== undefined ? { variables: input.variables } : {}),
      ...(input.idempotencyKey !== undefined
        ? { idempotencyKey: input.idempotencyKey }
        : {}),
    });
  }
}
