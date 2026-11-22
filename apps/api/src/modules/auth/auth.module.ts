import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerModule } from "@nestjs/throttler";

import { AuthController } from "./auth.controller";
import { AuthRepository } from "./auth.repository";
import { AuthService } from "./auth.service";
import { JwtAuthGuard } from "./jwt-auth.guard";
import { TokenService } from "./token.service";

const LOGIN_WINDOW_MS = 60_000;
const LOGIN_ATTEMPTS_PER_WINDOW = 10;

/** Login attempts are counted per client IP and email, so one account cannot be brute-forced. */
function loginTracker(request: Record<string, unknown>): string {
  const body = request.body;
  const email = body instanceof Object && "email" in body ? String(body.email) : "";

  return `${String(request.ip)}:${email.trim().toLowerCase()}`;
}

@Module({
  imports: [
    ThrottlerModule.forRoot({
      throttlers: [{ ttl: LOGIN_WINDOW_MS, limit: LOGIN_ATTEMPTS_PER_WINDOW }],
      getTracker: loginTracker,
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthRepository,
    AuthService,
    TokenService,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
  exports: [AuthService],
})
export class AuthModule {}
