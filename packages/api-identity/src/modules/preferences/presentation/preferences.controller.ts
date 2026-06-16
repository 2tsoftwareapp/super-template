import { Body, Controller, Get, Patch, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { ApiDataResponse } from '@repo/api-core';
import { CurrentUser } from '@repo/api-core';
import type { AuthenticatedRequestUser } from '@repo/api-core';
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
      input,
      request.requestContext,
    );
  }
}
