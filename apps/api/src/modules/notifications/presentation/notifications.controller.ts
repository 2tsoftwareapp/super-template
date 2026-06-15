import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import {
  ApiDataResponse,
  ApiPaginatedResponse,
  CountDto,
  SuccessFlagDto,
} from '../../../common/decorators/api-response.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Permissions } from '../../../common/decorators/permissions.decorator';
import type { AuthenticatedRequestUser } from '../../../common/types/request-context';
import { PERMISSION_NAMES } from '../../access-control/access-control.constants';
import { NotificationsService } from '../application/notifications.service';
import {
  NotificationDto,
  NotificationsQueryDto,
  SendNotificationDto,
} from './notifications.dto';

@ApiTags('notifications')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiPaginatedResponse(NotificationDto)
  async list(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Query() query: NotificationsQueryDto,
  ) {
    const result = await this.notificationsService.listForUser(user, query);

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

  @Get('unread-count')
  @ApiDataResponse(CountDto)
  async unreadCount(@CurrentUser() user: AuthenticatedRequestUser) {
    return {
      data: {
        count: await this.notificationsService.unreadCount(user),
      },
    };
  }

  @Patch(':id/read')
  @ApiDataResponse(NotificationDto)
  markRead(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Param('id') notificationId: string,
  ) {
    return this.notificationsService.markRead(user, notificationId);
  }

  @Patch('read-all')
  @ApiDataResponse(SuccessFlagDto)
  async markAllRead(@CurrentUser() user: AuthenticatedRequestUser) {
    await this.notificationsService.markAllRead(user);

    return {
      data: {
        success: true,
      },
    };
  }

  @Delete(':id')
  @ApiDataResponse(SuccessFlagDto)
  async delete(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Param('id') notificationId: string,
  ) {
    await this.notificationsService.delete(user, notificationId);

    return {
      data: {
        success: true,
      },
    };
  }
}

@ApiTags('admin-notifications')
@ApiBearerAuth()
@Controller('admin/notifications')
export class AdminNotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post()
  @Permissions(PERMISSION_NAMES.NOTIFICATIONS_SEND)
  @ApiDataResponse(NotificationDto, 201)
  send(
    @CurrentUser() actor: AuthenticatedRequestUser,
    @Body() input: SendNotificationDto,
    @Req() request: Request,
  ) {
    return this.notificationsService.sendToUser(
      actor,
      input,
      request.requestContext,
    );
  }
}
