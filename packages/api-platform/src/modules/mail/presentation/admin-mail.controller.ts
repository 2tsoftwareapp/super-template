import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  ApiDataResponse,
  ApiPaginatedResponse,
} from '@repo/api-core';
import { Permissions } from '@repo/api-core';
import { PERMISSION_NAMES } from '@repo/api-identity/modules/access-control/access-control.constants';

import { MailService } from '../application/mail.service';
import {
  MailDeliveriesQueryDto,
  MailDeliveryDto,
  MailPreviewDto,
} from './mail.dto';

@ApiTags('admin-mail')
@ApiBearerAuth()
@Controller('admin/mail')
export class AdminMailController {
  constructor(private readonly mailService: MailService) {}

  @Get('deliveries')
  @Permissions(PERMISSION_NAMES.MAIL_READ)
  @ApiPaginatedResponse(MailDeliveryDto)
  async listDeliveries(@Query() query: MailDeliveriesQueryDto) {
    const result = await this.mailService.listDeliveries(query);

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

  @Get('preview/:templateKey')
  @Permissions(PERMISSION_NAMES.MAIL_READ)
  @ApiDataResponse(MailPreviewDto)
  preview(@Param('templateKey') templateKey: string) {
    return this.mailService.previewTemplate(templateKey);
  }
}
