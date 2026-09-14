import type { AuthenticatedRequestUser } from "@repo/api-kernel";
import type { Request } from "express";

import { Body, Controller, Get, Patch, Req } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { AllowMustChangePassword, ApiDataResponse, SuccessFlagDto } from "@repo/api-runtime";
import { CurrentUser } from "@repo/api-runtime";

import { ChangePasswordUseCase } from "../application/use-cases/change-password.use-case";
import { GetUserUseCase } from "../application/use-cases/get-user.use-case";
import { UpdateProfileUseCase } from "../application/use-cases/update-profile.use-case";
import { ChangePasswordDto, UpdateProfileDto, UserDto } from "./dto/users.dto";

@ApiTags("users")
@ApiBearerAuth()
@Controller("users")
export class UsersController {
  constructor(
    private readonly getUser: GetUserUseCase,
    private readonly updateProfile: UpdateProfileUseCase,
    private readonly changePasswordUseCase: ChangePasswordUseCase,
  ) {}

  @Get("me")
  @ApiDataResponse(UserDto)
  getMe(@CurrentUser() user: AuthenticatedRequestUser) {
    return this.getUser.execute(user.userId);
  }

  @Patch("me")
  @ApiDataResponse(UserDto)
  updateMe(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Body() input: UpdateProfileDto,
    @Req() request: Request,
  ) {
    return this.updateProfile.execute(
      user.userId,
      {
        ...(input.displayName !== undefined ? { displayName: input.displayName } : {}),
        ...(input.avatarUrl !== undefined ? { avatarUrl: input.avatarUrl } : {}),
        ...(input.avatarFileId !== undefined ? { avatarFileId: input.avatarFileId } : {}),
      },
      request.requestContext,
    );
  }

  @Patch("me/password")
  @AllowMustChangePassword()
  @ApiDataResponse(SuccessFlagDto)
  async changePassword(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Body() input: ChangePasswordDto,
    @Req() request: Request,
  ) {
    await this.changePasswordUseCase.execute(
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
