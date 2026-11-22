import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerModule } from "@nestjs/throttler";

import { AuthController } from "./auth.controller";
import { AuthRepository } from "./auth.repository";
import { AuthService } from "./auth.service";
import { JwtAuthGuard } from "./jwt-auth.guard";
import { TokenService } from "./token.service";

const MINUTE_MS = 60_000;

function loginEmail(request: Record<string, unknown>): string {
  const body = request.body;
  const email = body instanceof Object && "email" in body ? String(body.email) : "";

  return email.trim().toLowerCase();
}

/**
 * Two limits on login: per client IP + email (tight, so a single attacker is
 * stopped fast without locking out the owner elsewhere) and per email alone
 * (looser, so a spoofed or rotating IP still cannot brute-force one account).
 */
@Module({
  imports: [
    ThrottlerModule.forRoot({
      throttlers: [
        {
          name: "client",
          ttl: MINUTE_MS,
          limit: 10,
          getTracker: (request: Record<string, unknown>) =>
            `${String(request.ip)}:${loginEmail(request)}`,
        },
        {
          name: "account",
          ttl: 15 * MINUTE_MS,
          limit: 50,
          getTracker: (request: Record<string, unknown>) => loginEmail(request),
        },
      ],
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
