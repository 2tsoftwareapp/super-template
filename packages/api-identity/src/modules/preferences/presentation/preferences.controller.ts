import type { AuthenticatedRequestUser } from "@repo/api-core";
import type { Request } from "express";

import { Body, Controller, Delete, Get, Patch, Req } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { ApiDataResponse } from "@repo/api-core";
import { CurrentUser } from "@repo/api-core";

import { GetPreferencesUseCase } from "../application/use-cases/get-preferences.use-case";
import { ResetPreferencesUseCase } from "../application/use-cases/reset-preferences.use-case";
import { UpdatePreferencesUseCase } from "../application/use-cases/update-preferences.use-case";
import { UpdatePreferencesDto, UserPreferencesDto } from "./preferences.dto";

@ApiTags("users")
@ApiBearerAuth()
@Controller("users/me/preferences")
export class PreferencesController {
  constructor(
    private readonly getPreferences: GetPreferencesUseCase,
    private readonly updatePreferences: UpdatePreferencesUseCase,
    private readonly resetPreferences: ResetPreferencesUseCase,
  ) {}

  @Get()
  @ApiDataResponse(UserPreferencesDto)
  getMyPreferences(@CurrentUser() user: AuthenticatedRequestUser) {
    return this.getPreferences.execute(user.userId);
  }

  @Patch()
  @ApiDataResponse(UserPreferencesDto)
  updateMyPreferences(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Body() input: UpdatePreferencesDto,
    @Req() request: Request,
  ) {
    return this.updatePreferences.execute(
      user.userId,
      {
        ...(input.theme !== undefined ? { theme: input.theme } : {}),
        ...(input.language !== undefined ? { language: input.language } : {}),
        ...(input.timezone !== undefined ? { timezone: input.timezone } : {}),
        ...(input.notificationPreferences !== undefined
          ? { notificationPreferences: input.notificationPreferences }
          : {}),
        ...(input.emailPreferences !== undefined
          ? { emailPreferences: input.emailPreferences }
          : {}),
      },
      request.requestContext,
    );
  }

  @Delete()
  @ApiDataResponse(UserPreferencesDto)
  resetMyPreferences(@CurrentUser() user: AuthenticatedRequestUser, @Req() request: Request) {
    return this.resetPreferences.execute(user.userId, request.requestContext);
  }
}
