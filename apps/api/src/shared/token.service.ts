import type { RequestUser } from "./current-user.decorator";

import { Injectable } from "@nestjs/common";
import { loadEnv } from "@lean/config";
import jwt from "jsonwebtoken";

import { AppError, ERROR_CODES } from "./errors";

@Injectable()
export class TokenService {
  private readonly env = loadEnv();

  sign(user: { id: string; role: string }): string {
    return jwt.sign({ role: user.role }, this.env.JWT_ACCESS_SECRET, {
      subject: user.id,
      expiresIn: this.env.JWT_ACCESS_TTL as jwt.SignOptions["expiresIn"],
    });
  }

  verify(token: string): RequestUser {
    try {
      const payload = jwt.verify(token, this.env.JWT_ACCESS_SECRET);

      if (typeof payload === "string" || typeof payload.sub !== "string") {
        throw new Error("malformed payload");
      }

      return { userId: payload.sub, role: String(payload.role ?? "USER") };
    } catch {
      throw new AppError(ERROR_CODES.AUTH_UNAUTHORIZED, "Invalid or expired token", 401);
    }
  }
}
