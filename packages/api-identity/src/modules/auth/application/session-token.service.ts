import { HttpStatus, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  AppError,
  durationToMilliseconds,
  EnvironmentService,
  ERROR_CODES,
} from '@repo/api-core';
import { randomUUID } from 'node:crypto';

import { AuthRepository } from '../infrastructure/auth.repository';
import { hashRefreshToken } from './auth.helpers';

export interface TokenPayload {
  sub: string;
  sid: string;
  jti: string;
  typ: 'access' | 'refresh';
  oid?: string;
}

@Injectable()
export class SessionTokenService {
  constructor(
    private readonly environmentService: EnvironmentService,
    private readonly jwtService: JwtService,
    private readonly authRepository: AuthRepository,
  ) {}

  async createSessionTokens(
    userId: string,
    organizationId: string,
    metadata: { ipAddress: string | null; userAgent: string | null },
  ) {
    const sessionId = randomUUID();
    const expiresAt = new Date(
      Date.now() +
        durationToMilliseconds(this.environmentService.values.JWT_REFRESH_TTL),
    );
    const accessToken = await this.signToken(
      userId,
      sessionId,
      'access',
      organizationId,
    );
    const refreshToken = await this.signToken(
      userId,
      sessionId,
      'refresh',
      organizationId,
    );
    const refreshTokenHash = await hashRefreshToken(refreshToken);
    const session = await this.authRepository.createSession({
      id: sessionId,
      userId,
      refreshTokenHash,
      expiresAt,
      lastUsedAt: new Date(),
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
    });

    if (!session) {
      throw new Error('Session insert returned no rows');
    }

    return {
      accessToken,
      refreshToken,
      session,
    };
  }

  async rotateSessionTokens(
    sessionId: string,
    refreshTokenHash: string,
    userId: string,
    organizationId: string,
    metadata: { ipAddress: string | null; userAgent: string | null },
  ) {
    const accessToken = await this.signToken(
      userId,
      sessionId,
      'access',
      organizationId,
    );
    const refreshToken = await this.signToken(
      userId,
      sessionId,
      'refresh',
      organizationId,
    );
    const nextRefreshTokenHash = await hashRefreshToken(refreshToken);
    const session = await this.authRepository.updateSessionIfMatches(
      sessionId,
      refreshTokenHash,
      {
        refreshTokenHash: nextRefreshTokenHash,
        expiresAt: new Date(
          Date.now() +
            durationToMilliseconds(
              this.environmentService.values.JWT_REFRESH_TTL,
            ),
        ),
        lastUsedAt: new Date(),
        ipAddress: metadata.ipAddress,
        userAgent: metadata.userAgent,
      },
    );

    if (!session) {
      await this.authRepository.revokeSession(sessionId);
      throw new AppError(
        ERROR_CODES.AUTH_REFRESH_TOKEN_REUSED,
        'Refresh token reuse detected',
        HttpStatus.UNAUTHORIZED,
      );
    }

    return {
      accessToken,
      refreshToken,
      session,
    };
  }

  async signToken(
    userId: string,
    sessionId: string,
    type: TokenPayload['typ'],
    organizationId: string,
  ) {
    const secret =
      type === 'access'
        ? this.environmentService.values.JWT_ACCESS_SECRET
        : this.environmentService.values.JWT_REFRESH_SECRET;
    const expiresIn = Math.floor(
      durationToMilliseconds(
        type === 'access'
          ? this.environmentService.values.JWT_ACCESS_TTL
          : this.environmentService.values.JWT_REFRESH_TTL,
      ) / 1000,
    );

    return this.jwtService.signAsync(
      {
        sub: userId,
        sid: sessionId,
        jti: randomUUID(),
        typ: type,
        oid: organizationId,
      },
      {
        secret,
        expiresIn,
      },
    );
  }

  async verifyToken(token: string, expectedType: TokenPayload['typ']) {
    try {
      const payload = await this.jwtService.verifyAsync<TokenPayload>(token, {
        secret:
          expectedType === 'access'
            ? this.environmentService.values.JWT_ACCESS_SECRET
            : this.environmentService.values.JWT_REFRESH_SECRET,
      });

      if (payload.typ !== expectedType) {
        throw new AppError(
          ERROR_CODES.AUTH_UNAUTHORIZED,
          'Invalid token type',
          HttpStatus.UNAUTHORIZED,
        );
      }

      return payload;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError(
        ERROR_CODES.AUTH_UNAUTHORIZED,
        'Token is invalid or expired',
        HttpStatus.UNAUTHORIZED,
      );
    }
  }
}
