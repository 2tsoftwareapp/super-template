import type { AuthenticatedRequestUser } from '@repo/api-core';
import type { Request } from 'express';

import { Body, Controller, Get, Patch, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  ApiDataResponse,
  SuccessFlagDto,
} from '@repo/api-core';
import { CurrentUser } from '@repo/api-core';

import { UsersService } from '../application/users.service';
import { ChangePasswordDto, UpdateProfileDto, UserDto } from './users.dto';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiDataResponse(UserDto)
  getMe(@CurrentUser() user: AuthenticatedRequestUser) {
    return this.usersService.getProfile(user.userId);
  }

  @Patch('me')
  @ApiDataResponse(UserDto)
  updateMe(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Body() input: UpdateProfileDto,
    @Req() request: Request,
  ) {
    return this.usersService.updateProfile(
      user.userId,
      {
        ...(input.displayName !== undefined
          ? { displayName: input.displayName }
          : {}),
        ...(input.avatarUrl !== undefined ? { avatarUrl: input.avatarUrl } : {}),
        ...(input.avatarFileId !== undefined
          ? { avatarFileId: input.avatarFileId }
          : {}),
      },
      request.requestContext,
    );
  }

  @Patch('me/password')
  @ApiDataResponse(SuccessFlagDto)
  async changePassword(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Body() input: ChangePasswordDto,
    @Req() request: Request,
  ) {
    await this.usersService.changePassword(
      user,
      input.currentPassword,
      input.newPassword,
      request.requestContext,
    );

    return {
      data: {
        success: true,
      },
    };
  }
}
