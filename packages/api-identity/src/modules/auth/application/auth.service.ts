import { randomUUID } from 'node:crypto';
import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ERROR_CODES } from '@repo/api-core';
import { AppError } from '@repo/api-core';
import type {
  AuthenticatedRequestUser,
  RequestContext,
} from '@repo/api-core';
import { durationToMilliseconds } from '@repo/api-core';
import { normalizeEmail } from '@repo/api-core';
import { EnvironmentService } from '@repo/api-core';
import { DATABASE } from '@repo/api-database';
import type {
  DatabaseClient,
  DatabaseExecutor,
} from '@repo/api-database';
import { runInTransaction } from '@repo/api-database';
import { AccessControlService } from '../../access-control/application/access-control.service';
import { AuditService } from '@repo/api-platform/modules/audit/application/audit.service';
import { MailService } from '@repo/api-platform/modules/mail/application/mail.service';
import { OrganizationsService } from '../../organizations/application/organizations.service';
import { UsersRepository } from '../../users/infrastructure/users.repository';
import { AuthRepository } from '../infrastructure/auth.repository';
import type {
  ForgotPasswordDto,
  LoginDto,
  RefreshTokenDto,
  RegisterDto,
  ResendVerificationDto,
  ResetPasswordDto,
  VerifyEmailDto,
} from '../presentation/auth.dto';
import {
  generateOpaqueToken,
  hashOpaqueToken,
  hashPassword,
  hashRefreshToken,
  verifyPassword,
  verifyRefreshTokenHash,
} from './auth.helpers';

type TokenPayload = {
  sub: string;
  sid: string;
  jti: string;
  typ: 'access' | 'refresh';
  oid?: string;
};

@Injectable()
export class AuthService {
  constructor(
    @Inject(DATABASE) private readonly database: DatabaseClient,
    private readonly environmentService: EnvironmentService,
    private readonly jwtService: JwtService,
    private readonly usersRepository: UsersRepository,
    private readonly accessControlService: AccessControlService,
    private readonly auditService: AuditService,
    private readonly authRepository: AuthRepository,
    private readonly mailService: MailService,
    private readonly organizationsService: OrganizationsService,
  ) {}

  async register(input: RegisterDto, requestContext?: RequestContext) {
    const email = normalizeEmail(input.email);
    await this.usersRepository.assertEmailAvailable(email);

    const result = await runInTransaction(
      this.database,
      async (transaction) => {
        const user = await this.usersRepository.create(
          {
            email,
            passwordHash: await hashPassword(input.password),
            displayName: input.displayName,
            status: 'PENDING',
          },
          transaction,
        );

        const userRole = await this.accessControlService.getRoleByName(
          'USER',
          transaction,
        );

        if (!userRole) {
          throw new AppError(
            ERROR_CODES.INTERNAL_ERROR,
            'Default USER role is missing',
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
        }

        await this.accessControlService.replaceUserRoles(
          user.id,
          [userRole.id],
          transaction,
        );

        await this.organizationsService.ensurePersonalOrganization(
          user.id,
          user.displayName,
          transaction,
        );

        const verificationToken = await this.issueEmailVerificationToken(
          user.id,
          transaction,
        );

        await this.auditService.log(
          {
            actorId: user.id,
            action: 'auth.registered',
            entityType: 'user',
            entityId: user.id,
            requestContext,
          },
          transaction,
        );

        return {
          user,
          verificationToken,
        };
      },
    );

    await this.sendVerificationEmail(
      result.user.email,
      result.verificationToken,
    );

    return {
      data: {
        success: true,
        message: 'Registration successful. Verify your email to continue.',
      },
    };
  }

  async login(input: LoginDto, requestContext?: RequestContext) {
    const email = normalizeEmail(input.email);
    const user = await this.usersRepository.findByEmail(email);

    if (!user) {
      await this.auditService.log({
        action: 'auth.login.failed',
        entityType: 'user',
        metadata: { email },
        requestContext,
      });
      throw new AppError(
        ERROR_CODES.AUTH_INVALID_CREDENTIALS,
        'Invalid email or password',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const passwordMatches = await verifyPassword(
      user.passwordHash,
      input.password,
    );

    if (!passwordMatches) {
      await this.auditService.log({
        actorId: user.id,
        action: 'auth.login.failed',
        entityType: 'user',
        entityId: user.id,
        metadata: { email },
        requestContext,
      });
      throw new AppError(
        ERROR_CODES.AUTH_INVALID_CREDENTIALS,
        'Invalid email or password',
        HttpStatus.UNAUTHORIZED,
      );
    }

    if (user.status === 'BLOCKED') {
      throw new AppError(
        ERROR_CODES.AUTH_FORBIDDEN,
        'Your account is blocked',
        HttpStatus.FORBIDDEN,
      );
    }

    if (user.status === 'PENDING' || !user.emailVerifiedAt) {
      throw new AppError(
        ERROR_CODES.AUTH_FORBIDDEN,
        'Verify your email before logging in',
        HttpStatus.FORBIDDEN,
      );
    }

    const accessProfile = await this.accessControlService.getAccessProfile(
      user.id,
    );
    const organizationId =
      await this.organizationsService.resolveOrganizationIdForUser(user.id);
    const sessionPayload = await this.createSessionTokens(
      user.id,
      organizationId,
      {
        ipAddress: requestContext?.ipAddress ?? null,
        userAgent: requestContext?.userAgent ?? null,
      },
    );

    await this.auditService.log({
      actorId: user.id,
      action: 'auth.login.succeeded',
      entityType: 'user',
      entityId: user.id,
      requestContext,
    });

    return {
      accessToken: sessionPayload.accessToken,
      refreshToken: sessionPayload.refreshToken,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl ?? null,
        status: user.status,
        emailVerifiedAt: user.emailVerifiedAt?.toISOString() ?? null,
        roles: accessProfile.roles,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      },
      permissions: accessProfile.permissions,
      organizationId,
      session: this.toSessionDto(
        sessionPayload.session,
        sessionPayload.session.id,
      ),
    };
  }

  async refresh(input: RefreshTokenDto, requestContext?: RequestContext) {
    const payload = await this.verifyToken(input.refreshToken, 'refresh');
    const session = await this.authRepository.findSessionForUser(
      payload.sid,
      payload.sub,
    );

    if (!session) {
      throw new AppError(
        ERROR_CODES.AUTH_SESSION_REVOKED,
        'Session is no longer available',
        HttpStatus.UNAUTHORIZED,
      );
    }

    if (session.revokedAt) {
      throw new AppError(
        ERROR_CODES.AUTH_SESSION_REVOKED,
        'Session has been revoked',
        HttpStatus.UNAUTHORIZED,
      );
    }

    if (session.expiresAt <= new Date()) {
      await this.authRepository.revokeSession(session.id);
      throw new AppError(
        ERROR_CODES.AUTH_SESSION_EXPIRED,
        'Session has expired',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const refreshTokenMatches = await verifyRefreshTokenHash(
      session.refreshTokenHash,
      input.refreshToken,
    );

    if (!refreshTokenMatches) {
      await this.authRepository.revokeSession(session.id);
      throw new AppError(
        ERROR_CODES.AUTH_REFRESH_TOKEN_REUSED,
        'Refresh token reuse detected',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const user = await this.usersRepository.findById(session.userId);

    if (user?.status !== 'ACTIVE') {
      await this.authRepository.revokeSession(session.id);
      throw new AppError(
        ERROR_CODES.AUTH_FORBIDDEN,
        'The account is not active',
        HttpStatus.FORBIDDEN,
      );
    }

    const accessProfile = await this.accessControlService.getAccessProfile(
      user.id,
    );
    const organizationId =
      await this.organizationsService.resolveOrganizationIdForUser(
        user.id,
        payload.oid,
      );
    const refreshedSession = await this.rotateSessionTokens(
      session.id,
      session.refreshTokenHash,
      user.id,
      organizationId,
      {
        ipAddress: requestContext?.ipAddress ?? null,
        userAgent: requestContext?.userAgent ?? null,
      },
    );

    return {
      accessToken: refreshedSession.accessToken,
      refreshToken: refreshedSession.refreshToken,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl ?? null,
        status: user.status,
        emailVerifiedAt: user.emailVerifiedAt?.toISOString() ?? null,
        roles: accessProfile.roles,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      },
      permissions: accessProfile.permissions,
      organizationId,
      session: this.toSessionDto(
        refreshedSession.session,
        refreshedSession.session.id,
      ),
    };
  }

  async switchOrganization(
    user: AuthenticatedRequestUser,
    organizationId: string,
    requestContext?: RequestContext,
  ) {
    await this.organizationsService.assertMembership(
      organizationId,
      user.userId,
    );

    const accessToken = await this.signToken(
      user.userId,
      user.sessionId,
      'access',
      organizationId,
    );

    await this.auditService.log({
      actorId: user.userId,
      action: 'auth.organization.switched',
      entityType: 'organization',
      entityId: organizationId,
      requestContext,
    });

    return {
      data: {
        accessToken,
        organizationId,
      },
    };
  }

  async logout(
    user: AuthenticatedRequestUser,
    requestContext?: RequestContext,
  ) {
    await this.authRepository.revokeSession(user.sessionId);
    await this.auditService.log({
      actorId: user.userId,
      action: 'auth.logout',
      entityType: 'session',
      entityId: user.sessionId,
      requestContext,
    });
  }

  async logoutAll(
    user: AuthenticatedRequestUser,
    requestContext?: RequestContext,
  ) {
    await this.authRepository.revokeAllSessionsForUser(user.userId);
    await this.auditService.log({
      actorId: user.userId,
      action: 'auth.logout_all',
      entityType: 'user',
      entityId: user.userId,
      requestContext,
    });
  }

  async getMe(user: AuthenticatedRequestUser) {
    const dbUser = await this.usersRepository.findById(user.userId);

    if (!dbUser) {
      throw new AppError(
        ERROR_CODES.USER_NOT_FOUND,
        'User not found',
        HttpStatus.NOT_FOUND,
      );
    }

    return {
      user: {
        id: dbUser.id,
        email: dbUser.email,
        displayName: dbUser.displayName,
        avatarUrl: dbUser.avatarUrl ?? null,
        status: dbUser.status,
        emailVerifiedAt: dbUser.emailVerifiedAt?.toISOString() ?? null,
        roles: user.roles,
        createdAt: dbUser.createdAt.toISOString(),
        updatedAt: dbUser.updatedAt.toISOString(),
      },
      permissions: user.permissions,
      sessionId: user.sessionId,
      organizationId: user.organizationId,
    };
  }

  async getSessions(user: AuthenticatedRequestUser) {
    const sessions = await this.authRepository.listSessionsForUser(user.userId);
    return sessions.map((session) =>
      this.toSessionDto(session, user.sessionId),
    );
  }

  async revokeSession(
    user: AuthenticatedRequestUser,
    sessionId: string,
    requestContext?: RequestContext,
  ) {
    const session = await this.authRepository.findSessionForUser(
      sessionId,
      user.userId,
    );

    if (!session) {
      throw new AppError(
        ERROR_CODES.AUTH_SESSION_REVOKED,
        'Session not found',
        HttpStatus.NOT_FOUND,
      );
    }

    await this.authRepository.revokeSession(sessionId);
    await this.auditService.log({
      actorId: user.userId,
      action: 'auth.session.revoked',
      entityType: 'session',
      entityId: sessionId,
      requestContext,
    });
  }

  async forgotPassword(input: ForgotPasswordDto) {
    const email = normalizeEmail(input.email);
    const user = await this.usersRepository.findByEmail(email);

    if (user) {
      const token = await this.issuePasswordResetToken(user.id);
      await this.sendPasswordResetEmail(user.email, token);
    }

    return {
      data: {
        success: true,
        message: 'If the account exists, a reset email has been sent.',
      },
    };
  }

  async resetPassword(
    input: ResetPasswordDto,
    requestContext?: RequestContext,
  ) {
    const tokenHash = hashOpaqueToken(input.token);
    const token =
      await this.authRepository.findValidPasswordResetToken(tokenHash);

    if (!token) {
      throw new AppError(
        ERROR_CODES.AUTH_UNAUTHORIZED,
        'Reset token is invalid or expired',
        HttpStatus.UNAUTHORIZED,
      );
    }

    await runInTransaction(this.database, async (transaction) => {
      await this.usersRepository.update(
        token.userId,
        {
          passwordHash: await hashPassword(input.newPassword),
        },
        transaction,
      );
      await this.authRepository.consumePasswordResetToken(
        token.id,
        transaction,
      );
      await this.authRepository.revokeAllSessionsForUser(
        token.userId,
        transaction,
      );
      await this.auditService.log(
        {
          actorId: token.userId,
          action: 'auth.password_reset.completed',
          entityType: 'user',
          entityId: token.userId,
          requestContext,
        },
        transaction,
      );
    });

    return {
      data: {
        success: true,
      },
    };
  }

  async verifyEmail(input: VerifyEmailDto, requestContext?: RequestContext) {
    const tokenHash = hashOpaqueToken(input.token);
    const token =
      await this.authRepository.findValidEmailVerificationToken(tokenHash);

    if (!token) {
      throw new AppError(
        ERROR_CODES.AUTH_UNAUTHORIZED,
        'Verification token is invalid or expired',
        HttpStatus.UNAUTHORIZED,
      );
    }

    await runInTransaction(this.database, async (transaction) => {
      await this.usersRepository.update(
        token.userId,
        {
          status: 'ACTIVE',
          emailVerifiedAt: new Date(),
        },
        transaction,
      );
      await this.authRepository.consumeEmailVerificationToken(
        token.id,
        transaction,
      );
      await this.auditService.log(
        {
          actorId: token.userId,
          action: 'auth.email_verified',
          entityType: 'user',
          entityId: token.userId,
          requestContext,
        },
        transaction,
      );
    });

    const user = await this.usersRepository.findById(token.userId);

    if (user) {
      await this.sendWelcomeEmail(user.email, user.displayName);
    }

    return {
      data: {
        success: true,
      },
    };
  }

  async resendVerification(input: ResendVerificationDto) {
    const email = normalizeEmail(input.email);
    const user = await this.usersRepository.findByEmail(email);

    if (user && user.status === 'PENDING') {
      const token = await this.issueEmailVerificationToken(user.id);
      await this.sendVerificationEmail(user.email, token);
    }

    return {
      data: {
        success: true,
        message: 'If the account exists, a verification email has been sent.',
      },
    };
  }

  async authenticateAccessToken(
    token: string,
  ): Promise<AuthenticatedRequestUser> {
    const payload = await this.verifyToken(token, 'access');
    const [session, user] = await Promise.all([
      this.authRepository.findSessionForUser(payload.sid, payload.sub),
      this.usersRepository.findById(payload.sub),
    ]);

    if (!session) {
      throw new AppError(
        ERROR_CODES.AUTH_SESSION_REVOKED,
        'Session not found',
        HttpStatus.UNAUTHORIZED,
      );
    }

    if (session.revokedAt) {
      throw new AppError(
        ERROR_CODES.AUTH_SESSION_REVOKED,
        'Session has been revoked',
        HttpStatus.UNAUTHORIZED,
      );
    }

    if (session.expiresAt <= new Date()) {
      throw new AppError(
        ERROR_CODES.AUTH_SESSION_EXPIRED,
        'Session has expired',
        HttpStatus.UNAUTHORIZED,
      );
    }

    if (!user) {
      throw new AppError(
        ERROR_CODES.USER_NOT_FOUND,
        'User not found',
        HttpStatus.NOT_FOUND,
      );
    }

    if (user.status !== 'ACTIVE') {
      throw new AppError(
        ERROR_CODES.AUTH_FORBIDDEN,
        'The account is not active',
        HttpStatus.FORBIDDEN,
      );
    }

    const accessProfile = await this.accessControlService.getAccessProfile(
      user.id,
    );
    const organizationId =
      await this.organizationsService.resolveOrganizationIdForUser(
        user.id,
        payload.oid,
      );

    return {
      userId: user.id,
      sessionId: session.id,
      email: user.email,
      displayName: user.displayName,
      status: user.status,
      roles: accessProfile.roles,
      permissions: accessProfile.permissions,
      organizationId,
    };
  }

  private async createSessionTokens(
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

  private async rotateSessionTokens(
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
            durationToMilliseconds(this.environmentService.values.JWT_REFRESH_TTL),
        ),
        lastUsedAt: new Date(),
        ipAddress: metadata.ipAddress,
        userAgent: metadata.userAgent,
      },
    );

    if (!session) {
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

  private async signToken(
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

  private async verifyToken(token: string, expectedType: TokenPayload['typ']) {
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

  private async issueEmailVerificationToken(
    userId: string,
    executor?: DatabaseExecutor,
  ) {
    const token = generateOpaqueToken();
    await this.authRepository.storeEmailVerificationToken(
      {
        userId,
        tokenHash: hashOpaqueToken(token),
        expiresAt: new Date(Date.now() + durationToMilliseconds('1d')),
      },
      executor,
    );

    return token;
  }

  private async issuePasswordResetToken(userId: string) {
    const token = generateOpaqueToken();
    await this.authRepository.storePasswordResetToken({
      userId,
      tokenHash: hashOpaqueToken(token),
      expiresAt: new Date(Date.now() + durationToMilliseconds('1h')),
    });

    return token;
  }

  private async sendVerificationEmail(email: string, token: string) {
    const verifyUrl = `${this.environmentService.values.NEXT_PUBLIC_WEB_URL}/verify-email?token=${token}`;
    await this.mailService.sendTemplate({
      templateKey: 'auth.verify-email',
      to: email,
      variables: {
        displayName: email,
        verifyUrl,
      },
    });
  }

  private async sendPasswordResetEmail(email: string, token: string) {
    const resetUrl = `${this.environmentService.values.NEXT_PUBLIC_WEB_URL}/reset-password?token=${token}`;
    await this.mailService.sendTemplate({
      templateKey: 'auth.reset-password',
      to: email,
      variables: {
        displayName: email,
        resetUrl,
      },
    });
  }

  private async sendWelcomeEmail(email: string, displayName: string) {
    await this.mailService.sendTemplate({
      templateKey: 'auth.welcome',
      to: email,
      variables: {
        displayName,
        webUrl: `${this.environmentService.values.NEXT_PUBLIC_WEB_URL}/login`,
      },
    });
  }

  private toSessionDto(
    session: Awaited<
      ReturnType<AuthRepository['findSessionById']>
    > extends infer T
      ? Exclude<T, null>
      : never,
    currentSessionId: string,
  ) {
    return {
      id: session.id,
      userId: session.userId,
      expiresAt: session.expiresAt.toISOString(),
      revokedAt: session.revokedAt?.toISOString() ?? null,
      lastUsedAt: session.lastUsedAt?.toISOString() ?? null,
      ipAddress: session.ipAddress ?? null,
      userAgent: session.userAgent ?? null,
      createdAt: session.createdAt.toISOString(),
      updatedAt: session.updatedAt.toISOString(),
      current: session.id === currentSessionId,
    };
  }
}
