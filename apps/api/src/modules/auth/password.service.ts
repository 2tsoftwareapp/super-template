import { randomBytes } from "node:crypto";

import type { SessionResponse } from "./auth.dto";

import { HttpStatus, Inject, Injectable } from "@nestjs/common";
import { loadEnv } from "@lean/config";
import { hashPassword, verifyPassword } from "@lean/db";

import { DatabaseService } from "../../shared/database.service";
import { AppError, ERROR_CODES } from "../../shared/errors";
import { MailService } from "../mail/mail.service";
import { AuthRepository } from "./auth.repository";
import { AuthService } from "./auth.service";
import { hashToken } from "./hash-token";

const RESET_TOKEN_BYTES = 32;
const RESET_TTL_MS = 60 * 60 * 1000;

/** Forgot / reset / change password. Every path that sets a password revokes all sessions. */
@Injectable()
export class PasswordService {
  private readonly env = loadEnv();

  constructor(
    @Inject(AuthRepository) private readonly users: AuthRepository,
    @Inject(AuthService) private readonly auth: AuthService,
    @Inject(MailService) private readonly mail: MailService,
    @Inject(DatabaseService) private readonly database: DatabaseService,
  ) {}

  /**
   * Always resolves the same way, so the endpoint does not reveal which emails
   * have accounts. Only an active account gets a mail.
   */
  async requestReset(email: string): Promise<void> {
    const user = await this.users.findByEmail(email.trim().toLowerCase());

    if (!user || user.status !== "ACTIVE") {
      return;
    }

    const token = randomBytes(RESET_TOKEN_BYTES).toString("base64url");
    const link = `${this.env.WEB_URL}/reset-password?token=${token}`;

    await this.database.transaction(async () => {
      await this.users.createPasswordReset({
        userId: user.id,
        tokenHash: hashToken(token),
        expiresAt: new Date(Date.now() + RESET_TTL_MS),
      });
      await this.mail.send({
        to: user.email,
        subject: "Reset your password",
        text: `Open this link within one hour to choose a new password:\n\n${link}\n\nIf you did not ask for this, ignore this mail.`,
      });
    });
  }

  async reset(token: string, password: string): Promise<void> {
    const passwordHash = hashPassword(password);

    await this.database.transaction(async () => {
      const userId = await this.users.consumePasswordReset(hashToken(token));

      if (!userId) {
        throw new AppError(
          ERROR_CODES.AUTH_RESET_TOKEN_INVALID,
          "This reset link is invalid or has expired",
          HttpStatus.BAD_REQUEST,
        );
      }

      await this.users.updateUser(userId, { passwordHash });
      await this.users.revokeAllForUser(userId);
    });
  }

  /** Signs every device out and returns a new session for the one that made the change. */
  async change(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<SessionResponse> {
    const user = await this.users.findById(userId);

    // 400, not 401: a 401 would make clients refresh and retry, then sign the user out.
    if (!user || !verifyPassword(currentPassword, user.passwordHash)) {
      throw new AppError(
        ERROR_CODES.AUTH_INVALID_CREDENTIALS,
        "Current password is incorrect",
        HttpStatus.BAD_REQUEST,
      );
    }

    const updated = await this.database.transaction(async () => {
      await this.users.revokeAllForUser(userId);
      return this.users.updateUser(userId, { passwordHash: hashPassword(newPassword) });
    });

    return this.auth.startSession(updated ?? user);
  }
}
