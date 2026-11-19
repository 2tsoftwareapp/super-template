import { Body, Controller, Get, HttpCode, Inject, Post, ValidationPipe } from "@nestjs/common";
import { Public } from "../../shared/public.decorator";
import { CurrentUser, type RequestUser } from "../../shared/current-user.decorator";
import { AuthService } from "./auth.service";
import { LoginDto, RefreshDto, type PublicUser, type SessionResponse } from "./auth.dto";

@Controller("auth")
export class AuthController {
  constructor(@Inject(AuthService) private readonly auth: AuthService) {}

  @Public()
  @Post("login")
  @HttpCode(200)
  async login(
    @Body(new ValidationPipe({ expectedType: LoginDto })) input: LoginDto,
  ): Promise<{ data: SessionResponse }> {
    return { data: await this.auth.login(input.email, input.password) };
  }

  @Public()
  @Post("refresh")
  @HttpCode(200)
  async refresh(
    @Body(new ValidationPipe({ expectedType: RefreshDto })) input: RefreshDto,
  ): Promise<{ data: SessionResponse }> {
    return { data: await this.auth.refresh(input.refreshToken) };
  }

  @Public()
  @Post("logout")
  @HttpCode(204)
  async logout(
    @Body(new ValidationPipe({ expectedType: RefreshDto })) input: RefreshDto,
  ): Promise<void> {
    await this.auth.logout(input.refreshToken);
  }

  @Get("me")
  async me(@CurrentUser() user: RequestUser): Promise<{ data: PublicUser }> {
    return { data: await this.auth.me(user.userId) };
  }
}
