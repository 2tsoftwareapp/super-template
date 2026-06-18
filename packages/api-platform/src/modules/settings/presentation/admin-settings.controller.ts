import type { AuthenticatedRequestUser } from '@repo/api-core';
import type { Request } from 'express';

import { Body, Controller, Get, Param, Patch, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  ApiArrayResponse,
  ApiDataResponse,
} from '@repo/api-core';
import { CurrentUser } from '@repo/api-core';
import { Authorize } from '@repo/api-core';
import { PERMISSION_NAMES } from '@repo/api-core';

import { SettingsService } from '../application/settings.service';
import { ApplicationSettingDto, UpdateSettingDto } from './settings.dto';

@ApiTags('admin-settings')
@ApiBearerAuth()
@Controller('admin/settings')
export class AdminSettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @Authorize({ permissions: [PERMISSION_NAMES.SETTINGS_READ] })
  @ApiArrayResponse(ApplicationSettingDto)
  async listSettings() {
    const settings = await this.settingsService.listAll();

    return {
      data: settings,
      meta: {},
    };
  }

  @Patch(':key')
  @Authorize({ permissions: [PERMISSION_NAMES.SETTINGS_UPDATE] })
  @ApiDataResponse(ApplicationSettingDto)
  updateSetting(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Param('key') key: string,
    @Body() input: UpdateSettingDto,
    @Req() request: Request,
  ) {
    return this.settingsService.updateByKey(
      user,
      key,
      { value: input.value },
      request.requestContext,
    );
  }
}
