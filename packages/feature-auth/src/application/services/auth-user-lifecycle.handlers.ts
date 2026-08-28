import type { JsonObject } from "@repo/api-kernel";

import { Inject, Injectable } from "@nestjs/common";
import {
  OUTBOX_APPENDER,
  type OutboxAppenderPort,
  type OutboxMessage,
} from "@repo/feature-outbox/contracts";

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
 * Auth-subscribed outbox handlers. Users publishes lifecycle events; auth
 * reacts with verification emails and session revocation. When auth is not
 * composed the events stay undelivered by design — authentication enforces
 * account state independently at login time.
 */
@Injectable()
export class AuthUserLifecycleHandlers {
  constructor(
    private readonly authMailService: AuthMailService,
    private readonly emailVerification: AuthEmailVerificationService,
    @Inject(AUTH_TOKEN_MAINTENANCE) private readonly tokenMaintenance: AuthTokenMaintenance,
    @Inject(OUTBOX_APPENDER) private readonly outbox: OutboxAppenderPort,
  ) {}

  async handleMessage(message: OutboxMessage): Promise<void> {
    switch (message.topic) {
      case "auth.send-verification-email": {
        const email = readString(message.payload, "email");
        const token = readString(message.payload, "token");
        const displayName = readString(message.payload, "displayName");
        await this.authMailService.sendVerificationEmail(email, token, displayName);
        return;
      }
      case "user.lifecycle.created": {
        await this.emailVerification.issueVerificationEmail(
          {
            userId: readString(message.payload, "userId"),
            email: readString(message.payload, "email"),
            displayName: readString(message.payload, "displayName") || null,
          },
          undefined,
        );
        return;
      }
      case "user.lifecycle.deleted":
      case "user.lifecycle.password-changed":
      case "user.lifecycle.status-blocked": {
        const userId = readString(message.payload, "userId");
        if (userId) {
          await this.tokenMaintenance.revokeAllSessionsForUser(userId);
        }
        return;
      }
      default:
        return;
    }
  }

  /** Publishes an auth-relevant user lifecycle event inside the caller's tx. */
  async publish(topic: string, payload: JsonObject, executor?: unknown): Promise<void> {
    await this.outbox.append(topic, payload, executor);
  }
}

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
