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
  Sse } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ACTION, ApiDataResponse, ApiPaginatedResponse, CountDto, perm, requireOrganizationId, SuccessFlagDto } from '@repo/api-core';
import { CurrentUser } from '@repo/api-core';
import { Authorize } from '@repo/api-core';
import { SkipEnvelope } from '@repo/api-core';

import { NotificationDispatchService } from '../application/services/notification-dispatch.service';
import { NotificationDeliveryUseCase } from '../application/use-cases/notification-delivery.use-case';
import { NotificationDeviceUseCase } from '../application/use-cases/notification-device.use-case';
import { NotificationInboxUseCase } from '../application/use-cases/notification-inbox.use-case';
import {
  DeviceTokenDto,
  NotificationDto,
  NotificationJobDto,
  NotificationJobsQueryDto,
  NotificationsQueryDto,
  RegisterDeviceDto,
  SendNotificationRequestDto } from './notifications.dto';

@ApiTags('notifications')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly inbox: NotificationInboxUseCase,
    private readonly device: NotificationDeviceUseCase,
    private readonly dispatch: NotificationDispatchService,
  ) {}

  @Get()
  @ApiPaginatedResponse(NotificationDto)
  async list(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Query() query: NotificationsQueryDto,
  ) {
    const result = await this.inbox.listForUser(user, {
      page: query.page,
      limit: query.limit,
      ...(query.unread !== undefined ? { unread: query.unread } : {}),
      ...(query.type !== undefined ? { type: query.type } : {}) });

    return {
      data: result.rows,
      meta: {
        page: query.page,
        limit: query.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / query.limit) } };
  }

  @Sse('stream')
  @SkipEnvelope()
  stream(
    @CurrentUser() user: AuthenticatedRequestUser,
  ): Observable<MessageEvent> {
    // SSE channel is scoped per user+org — cross-org events are never forwarded (T-007)
    const organizationId = requireOrganizationId(user);
    return this.dispatch.streamForUser(user.userId, organizationId);
  }

  @Get('unread-count')
  @ApiDataResponse(CountDto)
  async unreadCount(@CurrentUser() user: AuthenticatedRequestUser) {
    return {
      data: {
        count: await this.inbox.unreadCount(user) } };
  }

  @Post('devices')
  @ApiDataResponse(DeviceTokenDto, 201)
  async registerDevice(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Body() input: RegisterDeviceDto,
  ) {
    return {
      data: await this.device.registerDevice(user, {
        token: input.token,
        platform: input.platform }) };
  }

  @Delete('devices/:token')
  @ApiDataResponse(SuccessFlagDto)
  async unregisterDevice(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Param('token') token: string,
  ) {
    await this.device.unregisterDevice(user, token);

    return {
      data: {
        success: true } };
  }

  @Patch(':id/read')
  @ApiDataResponse(NotificationDto)
  async markRead(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Param('id', new ParseUUIDPipe()) notificationId: string,
  ) {
    return { data: await this.inbox.markRead(user, notificationId) };
  }

  @Patch('read-all')
  @ApiDataResponse(SuccessFlagDto)
  async markAllRead(@CurrentUser() user: AuthenticatedRequestUser) {
    await this.inbox.markAllRead(user);

    return {
      data: {
        success: true } };
  }

  @Delete(':id')
  @ApiDataResponse(SuccessFlagDto)
  async delete(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Param('id', new ParseUUIDPipe()) notificationId: string,
  ) {
    await this.inbox.delete(user, notificationId);

    return {
      data: {
        success: true } };
  }
}

@ApiTags('admin-notifications')
@ApiBearerAuth()
@Controller('admin/notifications')
export class AdminNotificationsController {
  constructor(private readonly delivery: NotificationDeliveryUseCase) {}

  @Post()
  @Authorize({ permissions: [perm('notifications', ACTION.CREATE)] })
  @ApiDataResponse(NotificationJobDto, 201)
  async send(
    @CurrentUser() actor: AuthenticatedRequestUser,
    @Body() input: SendNotificationRequestDto,
    @Req() request: Request,
  ) {
    return {
      data: await this.delivery.createDeliveryJob(
        actor,
        {
          audience: input.audience,
          type: input.type,
          title: input.title,
          body: input.body,
          ...(input.userId !== undefined ? { userId: input.userId } : {}),
          ...(input.userIds !== undefined ? { userIds: input.userIds } : {}),
          ...(input.data !== undefined ? { data: input.data } : {}),
          ...(input.scheduledAt !== undefined
            ? { scheduledAt: input.scheduledAt }
            : {}),
          ...(input.idempotencyKey !== undefined
            ? { idempotencyKey: input.idempotencyKey }
            : {}) },
        request.requestContext,
      ),
    };
  }

  @Get('jobs')
  @Authorize({ permissions: [perm('notifications', ACTION.CREATE)] })
  @ApiPaginatedResponse(NotificationJobDto)
  async listJobs(
    @CurrentUser() actor: AuthenticatedRequestUser,
    @Query() query: NotificationJobsQueryDto,
  ) {
    const result = await this.delivery.listJobs(actor, {
      page: query.page,
      limit: query.limit,
      ...(query.status !== undefined ? { status: query.status } : {}) });

    return {
      data: result.rows,
      meta: {
        page: query.page,
        limit: query.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / query.limit) } };
  }

  @Get('jobs/:id')
  @Authorize({ permissions: [perm('notifications', ACTION.CREATE)] })
  @ApiDataResponse(NotificationJobDto)
  async getJob(
    @CurrentUser() actor: AuthenticatedRequestUser,
    @Param('id', new ParseUUIDPipe()) jobId: string,
  ) {
    return {
      data: await this.delivery.getJob(actor, jobId) };
  }

  @Delete('jobs/:id')
  @Authorize({ permissions: [perm('notifications', ACTION.CREATE)] })
  @ApiDataResponse(NotificationJobDto)
  async cancelJob(
    @CurrentUser() actor: AuthenticatedRequestUser,
    @Param('id', new ParseUUIDPipe()) jobId: string,
  ) {
    return {
      data: await this.delivery.cancelJob(actor, jobId) };
  }
}
