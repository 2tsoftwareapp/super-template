import type { AuthenticatedRequestUser } from '@repo/api-core';
import type { Request } from 'express';
import type { Observable } from 'rxjs';

import {
  Body,
  Controller,
  Delete,
  Get,
  MessageEvent,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  Sse,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  ApiDataResponse,
  ApiPaginatedResponse,
  CountDto,
  SuccessFlagDto,
} from '@repo/api-core';
import { CurrentUser } from '@repo/api-core';
import { Permissions } from '@repo/api-core';
import { SkipEnvelope } from '@repo/api-core';
import { PERMISSION_NAMES } from '@repo/api-core';

import { NotificationsService } from '../application/notifications.service';
import {
  DeviceTokenDto,
  NotificationDto,
  NotificationJobDto,
  NotificationJobsQueryDto,
  NotificationsQueryDto,
  RegisterDeviceDto,
  SendNotificationRequestDto,
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

  @Sse('stream')
  @SkipEnvelope()
  stream(
    @CurrentUser() user: AuthenticatedRequestUser,
  ): Observable<MessageEvent> {
    return this.notificationsService.streamForUser(user.userId);
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

  @Post('devices')
  @ApiDataResponse(DeviceTokenDto, 201)
  async registerDevice(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Body() input: RegisterDeviceDto,
  ) {
    return {
      data: await this.notificationsService.registerDevice(user, input),
    };
  }

  @Delete('devices/:token')
  @ApiDataResponse(SuccessFlagDto)
  async unregisterDevice(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Param('token') token: string,
  ) {
    await this.notificationsService.unregisterDevice(user, token);

    return {
      data: {
        success: true,
      },
    };
  }

  @Patch(':id/read')
  @ApiDataResponse(NotificationDto)
  markRead(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Param('id', new ParseUUIDPipe()) notificationId: string,
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
    @Param('id', new ParseUUIDPipe()) notificationId: string,
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
  @ApiDataResponse(NotificationJobDto, 201)
  send(
    @CurrentUser() actor: AuthenticatedRequestUser,
    @Body() input: SendNotificationRequestDto,
    @Req() request: Request,
  ) {
    return this.notificationsService.createDeliveryJob(
      actor,
      input,
      request.requestContext,
    );
  }

  @Get('jobs')
  @Permissions(PERMISSION_NAMES.NOTIFICATIONS_SEND)
  @ApiPaginatedResponse(NotificationJobDto)
  async listJobs(@Query() query: NotificationJobsQueryDto) {
    const result = await this.notificationsService.listJobs(query);

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

  @Get('jobs/:id')
  @Permissions(PERMISSION_NAMES.NOTIFICATIONS_SEND)
  @ApiDataResponse(NotificationJobDto)
  async getJob(@Param('id', new ParseUUIDPipe()) jobId: string) {
    return {
      data: await this.notificationsService.getJob(jobId),
    };
  }

  @Delete('jobs/:id')
  @Permissions(PERMISSION_NAMES.NOTIFICATIONS_SEND)
  @ApiDataResponse(NotificationJobDto)
  async cancelJob(
    @CurrentUser() actor: AuthenticatedRequestUser,
    @Param('id', new ParseUUIDPipe()) jobId: string,
  ) {
    return {
      data: await this.notificationsService.cancelJob(actor, jobId),
    };
  }
}
