import type { AuthenticatedRequestUser } from '@repo/api-core';
import type { Request } from 'express';

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import {
  ApiDataResponse,
  ApiPaginatedResponse,
} from '@repo/api-core';
import { CurrentUser } from '@repo/api-core';
import { Permissions } from '@repo/api-core';
import { Public } from '@repo/api-core';
import { PERMISSION_NAMES } from '@repo/api-core';

import { InvitationsService } from '../application/invitations.service';
import {
  AcceptInvitationDto,
  CreateInvitationDto,
  InvitationDto,
  InvitationsQueryDto,
} from './invitations.dto';

@ApiTags('invitations')
@ApiBearerAuth()
@Controller('invitations')
export class InvitationsController {
  constructor(private readonly invitationsService: InvitationsService) {}

  @Post()
  @Permissions(PERMISSION_NAMES.INVITATIONS_CREATE)
  @Throttle({ default: { limit: 5, ttl: 3_600_000 } })
  @ApiDataResponse(InvitationDto, 201)
  create(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Body() input: CreateInvitationDto,
    @Req() request: Request,
  ) {
    return this.invitationsService.create(
      user,
      {
        email: input.email,
        entityType: input.entityType,
        entityId: input.entityId,
        ...(input.role !== undefined ? { role: input.role } : {}),
      },
      request.requestContext,
    );
  }

  @Get()
  @Permissions(PERMISSION_NAMES.INVITATIONS_READ)
  @ApiPaginatedResponse(InvitationDto)
  async list(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Query() query: InvitationsQueryDto,
  ) {
    const result = await this.invitationsService.list(user, {
      page: query.page,
      limit: query.limit,
      ...(query.email !== undefined ? { email: query.email } : {}),
      ...(query.entityType !== undefined
        ? { entityType: query.entityType }
        : {}),
      ...(query.entityId !== undefined ? { entityId: query.entityId } : {}),
      ...(query.status !== undefined ? { status: query.status } : {}),
    });

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

  @Post('accept')
  @Public()
  @Throttle({ default: { limit: 10, ttl: 3_600_000 } })
  @ApiDataResponse(InvitationDto)
  accept(@Body() input: AcceptInvitationDto, @Req() request: Request) {
    return this.invitationsService.accept(
      { token: input.token },
      undefined,
      request.requestContext,
    );
  }

  @Delete(':id')
  @Permissions(PERMISSION_NAMES.INVITATIONS_CREATE)
  @Throttle({ default: { limit: 10, ttl: 3_600_000 } })
  @ApiDataResponse(InvitationDto)
  revoke(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Param('id', new ParseUUIDPipe()) invitationId: string,
    @Req() request: Request,
  ) {
    return this.invitationsService.revoke(
      user,
      invitationId,
      request.requestContext,
    );
  }
}
