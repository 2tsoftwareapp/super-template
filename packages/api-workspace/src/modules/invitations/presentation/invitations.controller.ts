import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import {
  ApiDataResponse,
  ApiPaginatedResponse,
} from '@repo/api-core/common/decorators/api-response.decorator';
import { CurrentUser } from '@repo/api-core/common/decorators/current-user.decorator';
import { Permissions } from '@repo/api-core/common/decorators/permissions.decorator';
import { Public } from '@repo/api-core/common/decorators/public.decorator';
import type { AuthenticatedRequestUser } from '@repo/api-core/common/types/request-context';
import { PERMISSION_NAMES } from '@repo/api-identity/modules/access-control/access-control.constants';
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
  @ApiDataResponse(InvitationDto, 201)
  create(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Body() input: CreateInvitationDto,
    @Req() request: Request,
  ) {
    return this.invitationsService.create(user, input, request.requestContext);
  }

  @Get()
  @Permissions(PERMISSION_NAMES.INVITATIONS_READ)
  @ApiPaginatedResponse(InvitationDto)
  async list(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Query() query: InvitationsQueryDto,
  ) {
    const result = await this.invitationsService.list(user, query);

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
  @ApiDataResponse(InvitationDto)
  accept(@Body() input: AcceptInvitationDto, @Req() request: Request) {
    return this.invitationsService.accept(
      input,
      undefined,
      request.requestContext,
    );
  }

  @Delete(':id')
  @Permissions(PERMISSION_NAMES.INVITATIONS_CREATE)
  @ApiDataResponse(InvitationDto)
  revoke(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Param('id') invitationId: string,
    @Req() request: Request,
  ) {
    return this.invitationsService.revoke(
      user,
      invitationId,
      request.requestContext,
    );
  }
}
