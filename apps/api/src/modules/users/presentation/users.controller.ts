import { Body, Controller, Get, Patch, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import {
  ApiDataResponse,
  SuccessFlagDto,
} from '../../../common/decorators/api-response.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import type { AuthenticatedRequestUser } from '../../../common/types/request-context';
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
      input,
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
