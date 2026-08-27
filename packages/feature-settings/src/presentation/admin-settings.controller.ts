import type { AuthenticatedRequestUser } from "@repo/api-runtime";
import type { Request } from "express";

import { Body, Controller, Get, Param, Patch, Req } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { ACTION, ApiArrayResponse, ApiDataResponse, perm } from "@repo/api-runtime";
import { CurrentUser } from "@repo/api-runtime";
import { Authorize } from "@repo/api-runtime";
import { ROLE_NAMES } from "@repo/feature-access-control/contracts";

import { ListSettingsUseCase } from "../application/use-cases/list-settings.use-case";
import { UpdateSettingUseCase } from "../application/use-cases/update-setting.use-case";
import { ApplicationSettingDto, UpdateSettingDto } from "./settings.dto";

@ApiTags("admin-settings")
@ApiBearerAuth()
@Controller("admin/settings")
export class AdminSettingsController {
  constructor(
    private readonly listSettingsUseCase: ListSettingsUseCase,
    private readonly updateSettingUseCase: UpdateSettingUseCase,
  ) {}

  @Get()
  @Authorize({ roles: [ROLE_NAMES.SUPER_ADMIN], permissions: [perm("settings", ACTION.READ)] })
  @ApiArrayResponse(ApplicationSettingDto)
  async listSettings(@CurrentUser() user: AuthenticatedRequestUser) {
    const settings = await this.listSettingsUseCase.execute(user);

    return {
      data: settings,
      meta: {},
    };
  }

  @Patch(":key")
  @Authorize({ roles: [ROLE_NAMES.SUPER_ADMIN], permissions: [perm("settings", ACTION.UPDATE)] })
  @ApiDataResponse(ApplicationSettingDto)
  updateSetting(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Param("key") key: string,
    @Body() input: UpdateSettingDto,
    @Req() request: Request,
  ) {
    return this.updateSettingUseCase.execute(
      user,
      key,
      { value: input.value },
      request.requestContext,
    );
  }
}
