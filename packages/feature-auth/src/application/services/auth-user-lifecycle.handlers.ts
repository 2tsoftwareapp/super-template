import type { JsonObject } from "@repo/api-kernel";
import type { OutboxMessage } from "@repo/feature-outbox/contracts";

import { Inject, Injectable } from "@nestjs/common";

import {
  AUTH_TOKEN_MAINTENANCE,
  type AuthTokenMaintenance,
} from "../../public/auth-token-maintenance.port";
import { AuthEmailVerificationService } from "./auth-email-verification.service";
import { AuthMailService } from "./auth-mail.service";

function readString(payload: JsonObject, key: string): string {
  const value = payload[key];
  return typeof value === "string" ? value : "";
}

/**
 * Auth-subscribed outbox handlers. The users feature publishes lifecycle
 * events; auth reacts with verification emails and session revocation. When
 * auth is not composed the events stay undelivered by design — the users
 * feature never imports auth, so the broker is the only contract.
 *
 * Each handler is a Nest provider declared in AuthDataModule so constructor
 * dependencies resolve normally. The auth feature manifest lists the five
 * classes in `outboxHandlers`; the composition layer hands the list to
 * `OutboxModule.register({ imports: [AuthDataModule], handlers })`.
 */
@Injectable()
export class AuthSendVerificationEmailHandler {
  static readonly topic = "auth.send-verification-email";

  constructor(private readonly authMailService: AuthMailService) {}

  async handle(message: OutboxMessage): Promise<void> {
    const email = readString(message.payload, "email");
    const token = readString(message.payload, "token");
    const displayName = readString(message.payload, "displayName");
    await this.authMailService.sendVerificationEmail(email, token, displayName);
  }
}

@Injectable()
export class UserLifecycleCreatedHandler {
  static readonly topic = "user.lifecycle.created";

  constructor(private readonly emailVerification: AuthEmailVerificationService) {}

  async handle(message: OutboxMessage): Promise<void> {
    await this.emailVerification.issueVerificationEmail(
      {
        userId: readString(message.payload, "userId"),
        email: readString(message.payload, "email"),
        displayName: readString(message.payload, "displayName") || null,
      },
      undefined,
    );
  }
}

@Injectable()
export class UserLifecycleDeletedHandler {
  static readonly topic = "user.lifecycle.deleted";

  constructor(
    @Inject(AUTH_TOKEN_MAINTENANCE) private readonly tokenMaintenance: AuthTokenMaintenance,
  ) {}

  async handle(message: OutboxMessage): Promise<void> {
    const userId = readString(message.payload, "userId");
    if (userId) {
      await this.tokenMaintenance.revokeAllSessionsForUser(userId);
    }
  }
}

@Injectable()
export class UserLifecyclePasswordChangedHandler {
  static readonly topic = "user.lifecycle.password-changed";

  constructor(
    @Inject(AUTH_TOKEN_MAINTENANCE) private readonly tokenMaintenance: AuthTokenMaintenance,
  ) {}

  async handle(message: OutboxMessage): Promise<void> {
    const userId = readString(message.payload, "userId");
    if (userId) {
      await this.tokenMaintenance.revokeAllSessionsForUser(userId);
    }
  }
}

@Injectable()
export class UserLifecycleStatusBlockedHandler {
  static readonly topic = "user.lifecycle.status-blocked";

  constructor(
    @Inject(AUTH_TOKEN_MAINTENANCE) private readonly tokenMaintenance: AuthTokenMaintenance,
  ) {}

  async handle(message: OutboxMessage): Promise<void> {
    const userId = readString(message.payload, "userId");
    if (userId) {
      await this.tokenMaintenance.revokeAllSessionsForUser(userId);
    }
  }
}
