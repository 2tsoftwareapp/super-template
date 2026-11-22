import { Body, Controller, Get, HttpCode, Inject, Patch, Post, UseGuards } from "@nestjs/common";
import { SkipThrottle, ThrottlerGuard } from "@nestjs/throttler";

import { CurrentUser, type RequestUser } from "../../shared/current-user.decorator";
import { Public } from "../../shared/public.decorator";
import { validate } from "../../shared/validation";
import {
  ChangePasswordDto,
  ForgotPasswordDto,
  LoginDto,
  RefreshDto,
  RegisterDto,
  ResetPasswordDto,
  UpdateProfileDto,
  type PublicUser,
  type SessionResponse,
} from "./auth.dto";
import { AuthService } from "./auth.service";
import { PasswordService } from "./password.service";

@Controller("auth")
export class AuthController {
  constructor(
    @Inject(AuthService) private readonly auth: AuthService,
    @Inject(PasswordService) private readonly passwords: PasswordService,
  ) {}

  @Public()
  @Post("login")
  @HttpCode(200)
  @UseGuards(ThrottlerGuard)
  async login(@Body(validate(LoginDto)) input: LoginDto): Promise<{ data: SessionResponse }> {
    return { data: await this.auth.login(input.email, input.password) };
  }

  @Public()
  @Post("register")
  @HttpCode(201)
  @UseGuards(ThrottlerGuard)
  async register(
    @Body(validate(RegisterDto)) input: RegisterDto,
  ): Promise<{ data: SessionResponse }> {
    return { data: await this.auth.register(input) };
  }

  @Public()
  @Post("refresh")
  @HttpCode(200)
  async refresh(@Body(validate(RefreshDto)) input: RefreshDto): Promise<{ data: SessionResponse }> {
    return { data: await this.auth.refresh(input.refreshToken) };
  }

  @Public()
  @Post("logout")
  @HttpCode(204)
  async logout(@Body(validate(RefreshDto)) input: RefreshDto): Promise<void> {
    await this.auth.logout(input.refreshToken);
  }

  @Public()
  @Post("forgot-password")
  @HttpCode(202)
  @UseGuards(ThrottlerGuard)
  async forgotPassword(
    @Body(validate(ForgotPasswordDto)) input: ForgotPasswordDto,
  ): Promise<{ data: { status: "queued" } }> {
    await this.passwords.requestReset(input.email);

    return { data: { status: "queued" } };
  }

  /** No email in the body, so only the per-client bucket applies. */
  @Public()
  @Post("reset-password")
  @HttpCode(204)
  @UseGuards(ThrottlerGuard)
  @SkipThrottle({ account: true })
  async resetPassword(@Body(validate(ResetPasswordDto)) input: ResetPasswordDto): Promise<void> {
    await this.passwords.reset(input.token, input.password);
  }

  @Post("change-password")
  @HttpCode(200)
  async changePassword(
    @CurrentUser() user: RequestUser,
    @Body(validate(ChangePasswordDto)) input: ChangePasswordDto,
  ): Promise<{ data: SessionResponse }> {
    return {
      data: await this.passwords.change(user.userId, input.currentPassword, input.newPassword),
    };
  }

  @Get("me")
  async me(@CurrentUser() user: RequestUser): Promise<{ data: PublicUser }> {
    return { data: await this.auth.me(user.userId) };
  }

  @Patch("me")
  async updateMe(
    @CurrentUser() user: RequestUser,
    @Body(validate(UpdateProfileDto)) input: UpdateProfileDto,
  ): Promise<{ data: PublicUser }> {
    return { data: await this.auth.updateProfile(user.userId, input.displayName) };
  }
}
