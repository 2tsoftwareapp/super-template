import type { AuthenticatedRequestUser } from '@repo/api-core';
import type { Request } from 'express';

import { Body, Controller, Get, Patch, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ApiDataResponse } from '@repo/api-core';
import { CurrentUser } from '@repo/api-core';

import { PreferencesService } from '../application/preferences.service';
import { UpdatePreferencesDto, UserPreferencesDto } from './preferences.dto';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users/me/preferences')
export class PreferencesController {
  constructor(private readonly preferencesService: PreferencesService) {}

  @Get()
  @ApiDataResponse(UserPreferencesDto)
  getMyPreferences(@CurrentUser() user: AuthenticatedRequestUser) {
    return this.preferencesService.getForUser(user.userId);
  }

  @Patch()
  @ApiDataResponse(UserPreferencesDto)
  updateMyPreferences(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Body() input: UpdatePreferencesDto,
    @Req() request: Request,
  ) {
    return this.preferencesService.updateForUser(
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
}
