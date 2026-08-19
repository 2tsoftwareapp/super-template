import type { AuthenticatedRequestUser } from "@repo/api-core";
import type { Request } from "express";

import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post, Req } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import {
  AllowMustChangePassword,
  ApiArrayResponse,
  ApiDataResponse,
  SuccessFlagDto,
} from "@repo/api-core";
import { CurrentUser } from "@repo/api-core";

import { GetMeUseCase } from "../application/use-cases/get-me.use-case";
import { GetSessionsUseCase } from "../application/use-cases/get-sessions.use-case";
import { LogoutAllUseCase } from "../application/use-cases/logout-all.use-case";
import { LogoutUseCase } from "../application/use-cases/logout.use-case";
import { RevokeSessionUseCase } from "../application/use-cases/revoke-session.use-case";
import { SwitchOrganizationUseCase } from "../application/use-cases/switch-organization.use-case";
import { AuthMeDto, SwitchOrganizationResponseDto } from "./dto/auth-response.dto";
import { AuthSessionDto } from "./dto/auth-response.dto";
import { SwitchOrganizationDto } from "./dto/session.dto";

@ApiTags("auth")
@ApiBearerAuth()
@Controller("auth")
export class AuthSessionController {
  constructor(
    private readonly getMeUseCase: GetMeUseCase,
    private readonly logoutUseCase: LogoutUseCase,
    private readonly logoutAllUseCase: LogoutAllUseCase,
    private readonly switchOrganizationUseCase: SwitchOrganizationUseCase,
    private readonly getSessionsUseCase: GetSessionsUseCase,
    private readonly revokeSessionUseCase: RevokeSessionUseCase,
  ) {}

  @Get("me")
  @AllowMustChangePassword()
  @ApiDataResponse(AuthMeDto)
  getMe(@CurrentUser() user: AuthenticatedRequestUser) {
    return this.getMeUseCase.execute(user);
  }

  @Post("switch-organization")
  @ApiDataResponse(SwitchOrganizationResponseDto, 201)
  async switchOrganization(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Body() input: SwitchOrganizationDto,
    @Req() request: Request,
  ) {
    const result = await this.switchOrganizationUseCase.execute(
      user,
      input.organizationId,
      request.requestContext,
    );

    return { data: result };
  }

  @Post("logout")
  @AllowMustChangePassword()
  @ApiDataResponse(SuccessFlagDto, 201)
  async logout(@CurrentUser() user: AuthenticatedRequestUser, @Req() request: Request) {
    await this.logoutUseCase.execute(user, request.requestContext);

    return {
      data: {
        success: true,
      },
    };
  }

  @Post("logout-all")
  @ApiDataResponse(SuccessFlagDto, 201)
  async logoutAll(@CurrentUser() user: AuthenticatedRequestUser, @Req() request: Request) {
    await this.logoutAllUseCase.execute(user, request.requestContext);

    return {
      data: {
        success: true,
      },
    };
  }

  @Get("sessions")
  @ApiArrayResponse(AuthSessionDto)
  getSessions(@CurrentUser() user: AuthenticatedRequestUser) {
    return this.getSessionsUseCase.execute(user);
  }

  @Delete("sessions/:sessionId")
  @ApiDataResponse(SuccessFlagDto)
  async revokeSession(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Param("sessionId", new ParseUUIDPipe()) sessionId: string,
    @Req() request: Request,
  ) {
    await this.revokeSessionUseCase.execute(user, sessionId, request.requestContext);

    return {
      data: {
        success: true,
      },
    };
  }
}
