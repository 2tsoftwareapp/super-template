import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";

import { JwtAuthGuard } from "../../shared/jwt-auth.guard";
import { TokenService } from "../../shared/token.service";
import { AuthController } from "./auth.controller";
import { AuthRepository } from "./auth.repository";
import { AuthService } from "./auth.service";

@Module({
  controllers: [AuthController],
  providers: [
    AuthRepository,
    AuthService,
    TokenService,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
})
export class AuthModule {}
