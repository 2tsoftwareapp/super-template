import { Injectable } from "@nestjs/common";
import { loadEnv } from "@lean/config";
import jwt from "jsonwebtoken";

import { AppError, ERROR_CODES } from "../../shared/errors";

const ALGORITHM = "HS256";

@Injectable()
export class TokenService {
  private readonly env = loadEnv();

  sign(user: { id: string; role: string }): string {
    // `iat` has one-second resolution; `issuedAtMs` lets a revocation in the same second still apply.
    return jwt.sign({ role: user.role, issuedAtMs: Date.now() }, this.env.JWT_ACCESS_SECRET, {
      algorithm: ALGORITHM,
      subject: user.id,
      expiresIn: this.env.JWT_ACCESS_TTL as jwt.SignOptions["expiresIn"],
    });
  }

  /** Returns subject and issue time only: role and status are read fresh from the database. */
  verify(token: string): { userId: string; issuedAt: number } {
    let payload: string | jwt.JwtPayload;

    try {
      payload = jwt.verify(token, this.env.JWT_ACCESS_SECRET, { algorithms: [ALGORITHM] });
    } catch {
      throw new AppError(ERROR_CODES.AUTH_UNAUTHORIZED, "Invalid or expired token", 401);
    }

    if (
      typeof payload === "string" ||
      typeof payload.sub !== "string" ||
      typeof payload.issuedAtMs !== "number"
    ) {
      throw new AppError(ERROR_CODES.AUTH_UNAUTHORIZED, "Invalid or expired token", 401);
    }

    return { userId: payload.sub, issuedAt: payload.issuedAtMs };
  }
}
